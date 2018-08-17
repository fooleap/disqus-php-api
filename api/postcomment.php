<?php
/**
 * 发表评论
 *
 * @param thread  thread ID
 * @param parent  父评论 ID，可为空
 * @param message 评论内容
 * @param name    访客名字
 * @param email   访客邮箱
 * @param url     访客网址，可为空
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-18 16:24:05
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$authorName = $_POST['name'];
$authorEmail = $_POST['email'];
$authorUrl = $_POST['url'] == '' || $_POST['url'] == 'null' ? null : $_POST['url'];
$thread = $_POST['thread'];
$parent = $_POST['parent'];

// 存在父评，即回复
if(!empty($parent)){

    $fields = (object) array(
        'post' => $parent
    );
    $curl_url = '/api/3.0/posts/details.json?';
    $data = curl_get($curl_url, $fields);
    $pAuthor = $data->response->author;
    $pUid = md5($pAuthor->name.$pAuthor->email);
    if( $pAuthor->isAnonymous == false ){
        // 防止重复发邮件
        $approved = null;
    }
}

$curl_url = '/api/3.0/posts/create.json';
$postMessage = $emoji->toUnicode($_POST['message']);

// 已登录
if( isset($access_token) ){

    $post_data = (object) array(
        'thread' => $thread,
        'parent' => $parent,
        'message' => $postMessage,
        'ip_address' => $_SERVER['REMOTE_ADDR']
    );

} else {

    $post_data = (object) array(
        'thread' => $thread,
        'parent' => $parent,
        'message' => $postMessage,
        'author_name' => $authorName,
        'author_email' => $authorEmail,
        'author_url' => $authorUrl
    );

    if(!!$cache -> get('cookie')){
        $post_data -> state = $approved;
    }
}

$data = curl_post($curl_url, $post_data);

if( $data -> code == 0 ){

    $output = array(
        'code' => $data -> code,
        'thread' => $thread,
        'response' => post_format($data -> response)
    );

    $authors = $cache -> get('authors');

    // 父评邮箱号存在 & 父评是匿名用户
    if( isset($authors -> $pUid) && $pAuthor->isAnonymous){

        $fields = (object) array(
            'parent' => $parent,
            'parentEmail' => $authors -> $pUid,
            'id' => $data -> response -> id
        );

        $fields_string = fields_format($fields);

        $ch = curl_init();
        $options = array(
            CURLOPT_URL => getCurrentDir().'/sendemail.php',
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_POST => count($fields),
            CURLOPT_POSTFIELDS => $fields_string,
            CURLOPT_TIMEOUT => 1
        );
        curl_setopt_array($ch, $options);
        curl_exec($ch);
        $errno = curl_errno($ch);
        if ($errno == 60 || $errno == 77) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
            curl_exec($ch);
        }
        curl_close($ch);
    }

    // 匿名用户暂存邮箱号
    if( !isset($access_token) ){
        $uid = md5($authorName.email_format($authorEmail));
        $authors -> $uid = $authorEmail;
        $cache -> update($authors, 'authors');
    }

} else {

    $output = $data;

}

print_r(json_encode($output));

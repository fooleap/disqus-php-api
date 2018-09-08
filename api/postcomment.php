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
 * @version  2018-09-08 10:40:05
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
require_once('sendemail.php');

$authorName = $_POST['name'];
$authorEmail = $_POST['email'];
$authorUrl = $_POST['url'] == '' || $_POST['url'] == 'null' ? null : $_POST['url'];
$threadId = $_POST['thread'];
$parent = $_POST['parent'];
$authors = $cache -> get('authors');

$fields = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'thread' => $threadId
);
$curl_url = '/api/3.0/threads/details.json?';
$data = curl_get($curl_url, $fields);
$thread = thread_format($data -> response); // 文章信息

// 存在父评，即回复
if(!empty($parent)){

    $fields = (object) array(
        'post' => $parent,
    );
    $curl_url = '/api/3.0/posts/details.json?';
    $data = curl_get($curl_url, $fields);
    $pAuthor = $data->response->author;
    if( $pAuthor->isAnonymous == false ){
        // 防止重复发邮件
        $approved = null;
    }
    
    $pUid = md5($pAuthor->name.$pAuthor->email);
    $pEmail = $authors -> $pUid; // 被回复邮箱
    $pPost = post_format($data->response);
}

$curl_url = '/api/3.0/posts/create.json';
$postMessage = $emoji->toUnicode($_POST['message']);

// 已登录
if( isset($access_token) ){

    $post_data = (object) array(
        'thread' => $threadId,
        'parent' => $parent,
        'message' => $postMessage,
        'ip_address' => $_SERVER['REMOTE_ADDR']
    );

} else {

    $post_data = (object) array(
        'thread' => $threadId,
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
    $rPost = post_format($data->response);

    $output = array(
        'code' => $data -> code,
        'thread' => $thread,
        'parent' => $pPost,
        'response' => $rPost
    );

    if( function_exists('fastcgi_finish_request') ){
        print_r(json_encode($output));
        fastcgi_finish_request();
        // 父评是匿名用户
        if( $pAuthor->isAnonymous ){
            sendEmail($thread, $pPost, $rPost, $pEmail);
        }
    } else {
        if( $pAuthor->isAnonymous ){
            $output['verifyCode'] = $pUid;
        }
        print_r(json_encode($output));
    }


    // 匿名用户暂存邮箱号
    if( !isset($access_token) ){
        $authors = $cache -> get('authors');
        $uid = md5($authorName.email_format($authorEmail));
        $authors -> $uid = $authorEmail;
        $cache -> update($authors, 'authors');
    }

} else {

    $output = $data;
    print_r(json_encode($output));

}


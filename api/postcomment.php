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
 * @param unique  匿名用户 unique
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:36:35
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
require_once('sendemail.php');

$authorName = $_POST['name'];
$authorEmail = strtolower($_POST['email']);
$authorUrl = $_POST['url'] == '' || $_POST['url'] == 'null' ? null : $_POST['url'];
$threadId = $_POST['thread'];
$parent = $_POST['parent'];
$authors = $cache -> get('authors');
$approved = DISQUS_APPROVED == 1 ? 'approved' : null;
$pPost = null;

// 黑名单
if(DISQUS_BLACKLIST == 1){
    $fields = (object) array(
        'forum' => DISQUS_SHORTNAME,
        'type' => 'ip',
        'query' => get_ip()
    );
    $curl_url = '/api/3.0/blacklists/list.json?';
    $data = curl_get($curl_url, $fields);
    if(count($data -> response) != 0){
        $output = array(
            'code' => '12',
            'response' => 'You do not have permission to post on this thread'
        );
        print_r(jsonEncode($output));
        exit(0);
    }
}

// 文章信息
$fields = (object) array(
    'thread' => $threadId
);
$curl_url = '/api/3.0/threads/details.json?';
$data = curl_get($curl_url, $fields);
$thread = thread_format($data -> response);

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
        'ip_address' => get_ip()
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

    // 匿名用户暂存邮箱号
    if( !isset($access_token) ){
        $authors = $cache -> get('authors');
        $uid = md5($authorName.email_format($authorEmail));
        $authors -> $uid = $authorEmail;
        $cache -> update($authors, 'authors');
    }

    $rPost = post_format($data->response);

    $output = array(
        'code' => $data -> code,
        'thread' => $thread,
        'parent' => $pPost,
        'response' => $rPost
    );

    if( function_exists('fastcgi_finish_request') ){
        print_r(jsonEncode($output));
        fastcgi_finish_request();
        sendModEmail($thread, $pPost, $rPost);
        // 父评是匿名用户
        if( $pAuthor->isAnonymous ){
            sendAnonEmail($thread, $pPost, $rPost, $pEmail);
        }
    } else {
        $output['verifyCode'] = $pAuthor->isAnonymous ? $pUid : time();
        print_r(jsonEncode($output));
    }

} else {

    $output = $data;
    print_r(jsonEncode($output));

}


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
 * @version  2018-04-29 11:59:39
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');

$author_name = $_POST['name'];
$author_email = $_POST['email'];
$author_url = $_POST['url'] == '' || $_POST['url'] == 'null' ? null : $_POST['url'];

// 父评是已登录用户
if(!empty($_POST['parent'])){
    $fields = (object) array(
        'post' => $_POST['parent']
    );
    $curl_url = '/api/3.0/posts/details.json?';
    $data = curl_get($curl_url, $fields);
    $post = post_format($data->response);
    if($data->response->author->isAnonymous == false){
        $approved = null;
    }
}

$curl_url = '/api/3.0/posts/create.json';
$post_message = html_entity_decode($client->shortnameToUnicode($_POST['message']));

// 已登录
if( isset($access_token) ){

    $post_data = (object) array(
        'thread' => $_POST['thread'],
        'parent' => $_POST['parent'],
        'message' => $post_message,
        'ip_address' => $_SERVER['REMOTE_ADDR']
    );

} else {

    $post_data = (object) array(
        'thread' => $_POST['thread'],
        'parent' => $_POST['parent'],
        'message' => $post_message,
        'author_name' => $author_name,
        'author_email' => $author_email,
        'author_url' => $author_url,
    );
    if( !!$session ){
        $post_data -> state = $approved;
    }
}

$data = curl_post($curl_url, $post_data);

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'thread' => $_POST['thread'],
    'response' => post_format($data -> response)
) : $data;

if ( !empty($_POST['parent']) && $data -> code == 0 ){

    $mail_query = (object) array(
        'parent'=> $_POST['parent'],
        'id'=> $data -> response -> id,
        'link'=> $_POST['link'],
        'title'=> $_POST['title'],
        'session'=> $session
    );
    $mail = curl_init();
    $curl_opt = array(
        CURLOPT_URL => getCurrentDir().'/sendemail.php',
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => fields_format($mail_query),
        CURLOPT_TIMEOUT => 1
    );
    curl_setopt_array($mail, $curl_opt);
    curl_exec($mail);
    $errno = curl_errno($mail);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($mail, CURLOPT_SSL_VERIFYPEER, false); 
        curl_exec($mail);
    }
    curl_close($mail);
}
print_r(json_encode($output));

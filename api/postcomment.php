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
 * @version  2017-09-16 23:26:32 
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');

$author_name = $_POST['name'];
$author_email = $_POST['email'];
$author_url = $_POST['url'] == '' || $_POST['url'] == 'null' ? null : $_POST['url'];

// 管理员
if($author_name == DISQUS_USERNAME){
    $author_name = null;
    if( $author_email == DISQUS_EMAIL && strpos($session, 'session') !== false ){
        $author_email = null;
        $author_url = null;
        $approved = null;
    } 
}

// 父评是已登录用户
if(!empty($_POST['parent'])){
    $fields_data = array(
        'api_key' => DISQUS_PUBKEY,
        'post' => $_POST['parent']
    );
    $curl_url = '/api/3.0/posts/details.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);
    $post = post_format($data->response);
    if($data->response->author->isAnonymous == false){
        $approved = null;
    }
}

$curl_url = '/api/3.0/posts/create.json';
$post_message = html_entity_decode($client->shortnameToUnicode($_POST['message']));
//$post_message = $client->unifyUnicode($_POST['message']);

$post_data = array(
    'api_key' => DISQUS_PUBKEY,
    'thread' => $_POST['thread'],
    'parent' => $_POST['parent'],
    'message' => $post_message,
    'author_name' => $author_name,
    'author_email' => $author_email,
    'author_url' => $author_url,
    'state' => $approved
    //'ip_address' => $_SERVER["REMOTE_ADDR"]
);
$data = curl_post($curl_url, $post_data);

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'thread' => $_POST['thread'],
    'response' => post_format($data -> response)
) : $data;

if ( !empty($_POST['parent']) && $data -> code == 0 ){
    $mail_query = array(
        'parent'=> $_POST['parent'],
        'id'=> $data -> response -> id,
        'link'=> $_POST['link'],
        'title'=> $_POST['title'],
        'session'=> $session
    );
    $mail = curl_init();
    $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
    $curl_opt = array(
        CURLOPT_URL => $protocol.$_SERVER['HTTP_HOST'].dirname($_SERVER['SCRIPT_NAME']).'/sendemail.php',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $mail_query,
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

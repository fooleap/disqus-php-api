<?php
/**
 * 更新评论
 *
 * @param id       评论 ID
 * @param message  评论内容
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-08-05 06:33:56
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
date_default_timezone_set('UTC');
require_once('init.php');

$fields_data = array(
    'api_key' => DISQUS_PUBKEY,
    'post' => $_POST['id']
);
$curl_url = '/api/3.0/posts/details.json?'.http_build_query($fields_data);
$data = curl_get($curl_url);
$duration = time() - strtotime($data->response->createdAt);

$post_message = html_entity_decode($client->shortnameToUnicode($_POST['message']));

$output = array();

if($data->code !== 0){
    $output = array( 
        'code' => 2,
        'response' => '请求方式有误或不存在此 post'
    );
    print_r(json_encode($output));
    return;
}

if( $duration < 1800 ){
    // 三十分钟内
    $post_data = array(
        'api_key' => DISQUS_PUBKEY,
        'post' => $_POST['id'],
        'message' => $post_message
    );
    $curl_url = '/api/3.0/posts/update.json';
    $data = curl_post($curl_url, $post_data);
    $output = $data -> code == 0 ? array(
        'code' => $data -> code,
        'response' => post_format($data -> response)
    ) : $data;
} else {
    // 三十分钟外
    $output = array( 
        'code' => 0,
        'response' => '更新失败，留言时间已超过三十分钟'
    );
}

print_r(json_encode($output));

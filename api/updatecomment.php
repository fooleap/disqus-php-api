<?php
/**
 * 更新评论
 *
 * @param id       评论 ID
 * @param message  评论内容
 * @param unique   匿名用户 unique
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:37:59
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set('UTC');
require_once('init.php');

$fields = (object) array(
    'post' => $_POST['id']
);
$curl_url = '/api/3.0/posts/details.json?';
$data = curl_get($curl_url, $fields);
$duration = time() - strtotime($data->response->createdAt);

$post_message = $emoji->toUnicode($_POST['message']);

$output = array();

if($data->code !== 0){
    $output = array( 
        'code' => 2,
        'response' => '请求方式有误或不存在此 post'
    );
    print_r(jsonEncode($output));
    return;
}

$post_data = (object) array(
    'post' => $_POST['id'],
    'message' => $post_message
);

if( $duration < 1800 ){
    // 三十分钟内
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

print_r(jsonEncode($output));

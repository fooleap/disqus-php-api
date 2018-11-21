<?php
/**
 * Thread 打分
 *
 * @param thread   Thread Id
 * @param unique   匿名用户 unique
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:37:44
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$curl_url = '/api/3.0/threads/vote.json';
$post_data = (object) array(
    'thread' => $_POST['thread'],
    'vote' => $_POST['vote'],
);

$unique = $_POST['unique'];
if(!empty($unique)){
    $post_data -> unique = $unique;
}
$data = curl_post($curl_url, $post_data);
print_r(jsonEncode($data)); 

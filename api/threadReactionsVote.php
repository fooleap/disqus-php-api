<?php
/**
 * Thread 打分
 *
 * @param thread   Thread Id
 * @param reaction Reaction Id
 * @param unique   匿名用户 unique
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:37:18
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$curl_url = '/api/3.0/threadReactions/vote';
$post_data = (object) array(
    'thread' => $_POST['thread'],
    'reaction' => $_POST['reaction'],
);

$unique = $_POST['unique'];
if(!empty($unique)){
    $post_data -> unique = $unique;
}
$data = curl_post($curl_url, $post_data);
print_r(jsonEncode($data)); 

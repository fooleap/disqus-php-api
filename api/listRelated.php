<?php
/**
 * 获取相关 Thread
 *
 * @param thread   thread ID
 * @param limit    数量，默认为 4
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:35:22
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$fields = (object) array(
    'limit' => isset($_GET['limit']) ? $_GET['limit'] : 4,
    'thread' => $_GET['thread']
);
$curl_url = '/api/3.0/discovery/listRelated.json?';
$data = curl_get($curl_url, $fields);

$threads = array();
foreach ( $data -> response as $key => $thread ) {
    $threads[$key] = thread_format($thread);
}

$threadIds = array_column($threads, 'id');

$fields = (object) array(
    'thread' => $threadIds
);

$curl_url = '/api/3.0/discovery/listTopPost.json?';
$data = curl_get($curl_url, $fields);
foreach ( $data -> response as $key => $post ) {
    $index = array_search($post -> thread, $threadIds);
    $threads[$index] -> topPost = post_format($post);
}

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'response' => $threads
) : $data;

print_r(jsonEncode($output));

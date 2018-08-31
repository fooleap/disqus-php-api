<?php
/**
 * 获取最近热门 Thread
 * 暂时设置为 30 天，4 条
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-31 13:41:56
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$fields = (object) array(
    'limit' => 4,
    'with_top_post' => true,
    'forum' => DISQUS_SHORTNAME,
    'interval' => '30d'
);
$curl_url = '/api/3.0/threads/listPopular.json?';
$data = curl_get($curl_url, $fields);

$threads = array();
foreach ( $data -> response as $key => $thread ) {
    $threads[$key] = thread_format($thread);
    $threads[$key] -> topPost = post_format($thread -> topPost);
}

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'response' => $threads
) : $data;

print_r(json_encode($output));

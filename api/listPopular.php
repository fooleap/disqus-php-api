<?php
/**
 * 获取最近热门 Thread
 *
 * @param limit    数量，默认为 4
 * @param interval 时间段，默认为 30d（30天内）
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:35:06
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$fields = (object) array(
    'limit' => isset($_GET['limit']) ? $_GET['limit'] : 4,
    'with_top_post' => true,
    'forum' => DISQUS_SHORTNAME,
    'interval' => isset($_GET['interval']) ? $_GET['interval'] : '30d'
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

print_r(jsonEncode($output));

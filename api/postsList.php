<?php
/**
 * 获取最近评论
 *
 * @param limit    数量，默认为 5
 * @param cursor   起始评论 cursor
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-12-06 09:44:41
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$fields = (object) array(
    'limit' => isset($_GET['limit']) ? $_GET['limit'] : 5,
    'forum' => DISQUS_SHORTNAME,
    'related' => 'thread',
    'cursor' => isset($_GET['cursor']) ? $_GET['cursor'] : null
);
$curl_url = '/api/3.0/posts/list.json?';
$data = curl_get($curl_url, $fields);

$posts = $data -> response;
foreach ( $posts as $key => $post ) {
    $posts[$key] -> thread = thread_format($post -> thread);
    $posts[$key] = post_format($post);
}

$output = $data -> code == 0 ? array(
    'code' => 0,
    'cursor' => $data -> cursor,
    'response' => $posts
) : $data;

print_r(jsonEncode($output));

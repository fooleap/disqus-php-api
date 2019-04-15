<?php
/**
 * 获取评论列表
 * 暂以 50 条每页，倒序为准
 *
 * @param link   页面链接
 * @param cursor 当前评论位置
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-04-15 13:20:10
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$thread = $_GET['thread'];
$order = $_GET['order'];
$forum = $cache -> get('forum');

if(!!empty($order)){
    switch($forum -> sort){
    case 1:
        $order = 'asc';
        break;
    case 2:
        $order = 'desc';
        break;
    case 4:
        $order = 'popular';
        break;
    }
}

$fields = (object) array(
    'cursor' => $_GET['cursor'],
    'limit' => 50,
    'order' => $order,
    'thread' => $thread
);

$curl_url = '/api/3.0/threads/listPostsThreaded?';
$data = curl_get($curl_url, $fields);

$posts = array();
if (is_array($data -> response) || is_object($data -> response)){
    foreach ( $data -> response as $key => $post ) {
        $posts[$key] = post_format($post);
    }
}

$output = $data -> code == 0 ? (object) array(
    'code' => 0,
    'cursor' => $data -> cursor,
    'response' => $posts,
) : $data;

print_r(jsonEncode($output));

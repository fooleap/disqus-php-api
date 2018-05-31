<?php
/**
 * 获取评论列表
 * 暂以 50 条每页，倒序为准
 *
 * @param link   页面链接
 * @param cursor 当前评论位置
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-05-31 15:31:28 
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$thread = 'ident:'.$_GET['ident'];

$fields = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'cursor' => $_GET['cursor'],
    'limit' => 50,
    'order' => 'desc',
    'thread' => $thread
);

$curl_url = '/api/3.0/threads/listPostsThreaded?';
$data = curl_get($curl_url, $fields);

if( $data -> code == 2 ){

    $thread = 'link:'.$website.$_GET['link'];
    $fields -> thread = $thread;
    $data = curl_get($curl_url, $fields);

}

$fields = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'thread' => $thread
);

$curl_url = '/api/3.0/threads/details.json?';
$detail = curl_get($curl_url, $fields);

$posts = array();
if (is_array($data -> response) || is_object($data -> response)){
    foreach ( $data -> response as $key => $post ) {
        $posts[$key] = post_format($post);
    }
}

$output = $data -> code == 0 ? (object) array(
    'code' => $detail -> code,
    'cursor' => $data -> cursor,
    'forum' => $forum_data -> forum,
    'link' => 'https://disqus.com/home/discussion/'.DISQUS_SHORTNAME.'/'.$detail -> response -> slug.'/?l=zh',
    'posts' => $detail -> response -> posts,
    'response' => $posts,
    'thread' => $detail -> response -> id
) : $data;

print_r(json_encode($output));

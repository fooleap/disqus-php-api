<?php
/**
 * 获取文章详情
 *
 * @param thread   Thread Id
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-11-06 13:41:15
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$forum = $cache -> get('forum');
$forum -> avatar = strpos($forum -> avatar, 'noavatar92') !== false ? 'https://a.disquscdn.com/images/noavatar92.png' : $forum -> avatar;
$thread = 'ident:'.$_GET['ident'];
$fields = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'thread' => $thread
);

$curl_url = '/api/3.0/threads/details.json?';
$data = curl_get($curl_url, $fields);
if( $data -> code == 2 ){
    $thread = 'link:'.$website.$_GET['link'];
    $fields -> thread = $thread;
    $data = curl_get($curl_url, $fields);
}
$fields = (object) array(
    'thread' => $data -> response -> id
);
$curl_url = '/api/3.0/threads/listUsersVotedThread.json?';
$userdata = curl_get($curl_url, $fields);
if( !$data -> response -> ipAddress){
    adminLogin();
}

$output = $data -> code == 0 ? (object) array(
    'code' => 0,
    'response' => thread_format($data -> response),
    'forum' => $forum,
    'votedusers' => $userdata -> response
) : $data;

print_r(jsonEncode($output));

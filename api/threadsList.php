<?php
/**
 * 获取 Thread 相关列表
 *
 * @param type     类型，默认获取最近 thread，可选 hot、related‘、popular。
 * @param limit    数量，默认为 4
 * @param thread   thread ID，related 必填
 * @param interval 时间段，默认为 30d（30天内），仅 popular 可选
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-04-30 12:52:56
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$limit = isset($_GET['limit']) ? $_GET['limit'] : 4;
$type = $_GET['type'];
switch ($type)
{
case 'hot':
    $fields = (object) array(
        'limit' => $limit,
        'forum' => DISQUS_SHORTNAME
    );
    $curl_url = '/api/3.0/threads/listHot.json?';
    break;  
case 'popular':
    $fields = (object) array(
        'limit' => $limit,
        'forum' => DISQUS_SHORTNAME,
        'interval' => isset($_GET['interval']) ? $_GET['interval'] : '30d'
    );
    $curl_url = '/api/3.0/threads/listPopular.json?';
    break;  
case 'related':
    $fields = (object) array(
        'limit' => $limit,
        'thread' => $_GET['thread']
    );
    $curl_url = '/api/3.0/discovery/listRelated.json?';
    break;
default:
    $fields = (object) array(
        'limit' => $limit,
        'forum' => DISQUS_SHORTNAME
    );
    if(isset($_GET['links'])){
        $links = explode(',', $_GET['links']);
        foreach( $links as $key=>$value ){
            $links[$key] = $website.$value;
        }
        $fields -> {'thread:link'} = $links;
        $fields -> limit = 100;
    }
    $curl_url = '/api/3.0/threads/list.json?';
}

$data = curl_get($curl_url, $fields);

$threads = array();
foreach ( $data -> response as $key => $thread ) {
  $threads[$key] = thread_format($thread);
}

if(count($threads) > 0 && $type != ''){
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
}

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'response' => $threads
) : $data;

print_r(jsonEncode($output));

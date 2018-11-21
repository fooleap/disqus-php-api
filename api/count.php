<?php
/**
 * 批量获取评论数
 *
 * @param links  页面链接，以“,”分隔
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:33:51
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$links = explode(',', $_GET['links']);
foreach( $links as $key=>$value ){
    $links[$key] = $website.$value;
}

$fields = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'limit' => 100,
    'thread:link' => $links
);

$curl_url = '/api/3.0/threads/list.json?';

$data = curl_get($curl_url, $fields);

$countArr = array();
foreach ( $data -> response as $key => $post ) {
    $countArr[$key] = array(
        'link'=> $post -> link,
        'posts'=> $post -> posts
    );
}

$output = $data -> code == 0 ? array(
    'code' => 0,
    'response' => $countArr
) : $data;

print_r(jsonEncode($output)); 

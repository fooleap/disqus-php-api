<?php
/**
 * 获取最近热门 Thread
 * 暂时设置为 30 天，5 条
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-06-27 09:07:07
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');

$fields_data = array(
    'api_key' => DISQUS_PUBKEY,
    'limit' => 5,
    'forum' => DISQUS_SHORTNAME,
    'interval' => '30d'
);
$curl_url = '/api/3.0/threads/listPopular.json?'.http_build_query($fields_data);
$data = curl_get($curl_url);

foreach ( $data -> response as $key => $post ) {
    $posts[$key] = array( 
        'link'=> $post->link,
        'title'=> $post -> clean_title
    );
}

$output = $data -> code == 0 ? array(
    'code' => $data -> code,
    'response' => $posts
) : $data;

print_r(json_encode($output));

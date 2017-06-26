<?php
/**
 * 批量获取评论数
 *
 * @param links  页面链接，以“,”分隔
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-06-27 09:07:07
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');

$links = '&thread=link:'.DISQUS_WEBSITE.preg_replace('/,/i','&thread=link:'.DISQUS_WEBSITE, $_GET['links']);

$fields_data = array(
    'api_key' => DISQUS_PUBKEY,
    'forum' => DISQUS_SHORTNAME
);

$curl_url = '/api/3.0/threads/list.json?'.http_build_query($fields_data).$links;
$data = curl_get($curl_url);

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

print_r(json_encode($output)); 

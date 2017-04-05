<?php
namespace Emojione;
require_once('init.php');

$links = '&thread=link:'.$origin.preg_replace('/,/i','&thread=link:'.$origin, $_GET['link']);

$fields_data = array(
    'api_key' => $public_key,
    'forum' => $forum
);

$curl_url = 'https://disqus.com/api/3.0/threads/list.json?'.http_build_query($fields_data).$links;
$data = curl_get($curl_url);

foreach ( $data -> response as $key => $post ) {
    $countArr[$key] = array(
        'link'=> $post -> link,
        'posts'=> $post -> posts
    );
}

$count = array(
    'code' => 0,
    'response' => $countArr
);
print_r(json_encode($count)); 

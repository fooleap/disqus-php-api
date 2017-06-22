<?php
namespace Emojione;
require_once('init.php');

$links = '&thread=link:'.DISQUS_WEBSITE.preg_replace('/,/i','&thread=link:'.DISQUS_WEBSITE, $_GET['link']);

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

$count = array(
    'code' => 0,
    'response' => $countArr
);
print_r(json_encode($count)); 

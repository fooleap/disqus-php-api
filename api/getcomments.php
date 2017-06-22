<?php
    namespace Emojione;
    require_once('init.php');

    $fields_data = array(
        'api_key' => DISQUS_PUBKEY,
        'cursor' => $_GET['cursor'],
        'limit' => 50,
        'forum' => DISQUS_SHORTNAME,
        'order' => 'desc',
        'thread' => 'link:'.DISQUS_WEBSITE.$_GET['link']
    );
    $curl_url = '/api/3.0/posts/list.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);

    $fields_data = array(
        'api_key' => DISQUS_PUBKEY,
        'forum' => DISQUS_SHORTNAME,
        'thread' => 'link:'.DISQUS_WEBSITE.$_GET['link'],
    );
    $curl_url = '/api/3.0/threads/details.json?'.http_build_query($fields_data);
    $detail = curl_get($curl_url);

    foreach ( $data -> response as $key => $post ) {
        $posts[$key] = post_format($post);
    }

    $listposts = array(
       'code' => $detail -> code,
       'cursor' => $data -> cursor,
       'link' => 'https://disqus.com/home/discussion/'.DISQUS_SHORTNAME.'/'.$detail -> response -> slug.'/?l=zh',
       'posts' => $detail -> response -> posts,
       'response' => array_reverse($posts),
       'thread' => $detail -> response -> id
    );
    
    print_r(json_encode($listposts));

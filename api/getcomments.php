<?php
    namespace Emojione;
    require_once('init.php');

    $fields_data = array(
        'api_key' => $public_key,
        'cursor' => $_GET['cursor'],
        'limit' => 100,
        'forum' => $forum,
        'order' => 'asc',
        'thread' => 'link:'.$origin.$_GET['link']
    );
    $curl_url = 'https://disqus.com/api/3.0/posts/list.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);

    $fields_data = array(
        'api_key' => $public_key,
        'forum' => $forum,
        'thread' => 'link:'.$origin.$_GET['link'],
    );
    $curl_url = 'https://disqus.com/api/3.0/threads/details.json?'.http_build_query($fields_data);
    $detail = curl_get($curl_url);

    foreach ( $data -> response as $key => $post ) {
        $posts[$key] = post_format($post);
    }

    $listposts = $detail -> code === 2 ? array(
        'code' => $detail -> code,
    ) : array(
        'code' => $detail -> code,
        'cursor' => $data -> cursor,
        'link' => 'https://disqus.com/home/discussion/'.$forum.'/'.$detail -> response -> slug,
        'posts' => count($posts),
        'response' => $posts,
        'thread' => $detail -> response -> id
    );

    print_r(json_encode($listposts));

<?php

    namespace Emojione;
    require_once('init.php');

    $fields_data = array(
        'api_key' => $public_key,
        'limit' => 6,
        'forum' => $forum,
        'category' => 1352108,
        'interval' => '30d'
    );
    $curl_url = 'https://disqus.com/api/3.0/threads/listPopular.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);

    $i = 0;
    foreach ( $data -> response as $key => $post ) {
        if( $post -> category != '6574620' && $i < 5 ){
            $posts[$i] = array( 
                'link'=> substr($post->link, 23),
                'title'=> $post -> clean_title
            );
            $i++;
        }
    }
    $listposts = array(
       'code' => $data -> code,
       'response' => $posts
    );
    print_r(json_encode($listposts));

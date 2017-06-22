<?php
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
    $listposts = array(
        'code' => $data -> code,
        'response' => $posts
    );
    print_r(json_encode($listposts));

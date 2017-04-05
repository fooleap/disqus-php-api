<?php
    namespace Emojione;
    require_once('init.php');
    $curl_url = 'https://disqus.com/api/3.0/threads/create.json';
    $post_data = array(
        'api_key' => $public_key,
        'forum' => $forum,
        'message' => $_POST['message'],
        'slug' => $_POST['slug'],
        'title' => $_POST['title'],
        'url' => $_POST['url']
    );
    $data = curl_post($curl_url, $post_data);
    print_r(json_encode($data)); 

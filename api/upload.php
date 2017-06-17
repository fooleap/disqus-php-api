<?php
    namespace Emojione;
    require_once('init.php');
    $media_host = $gfw_inside ? 'https://'.$disqus_media_ip : 'https://uploads.services.disqus.com';
    $curl_url = $media_host.'/api/3.0/media/create.json';
    $cfile = curl_file_create($_FILES['file']['tmp_name'],$_FILES['file']['type'],$_FILES['file']['name']);
    $filename = $_FILES['file']['name'];
    $filedata = $_FILES['file']['tmp_name'];
    $filesize = $_FILES['file']['size'];
    $post_data = array(
        'api_key' => $public_key,
        'permanent' => 1,
        'upload' => $cfile
    );
    $data = curl_post($curl_url, $post_data);
    print_r(json_encode($data));

<?php
    namespace Emojione;
    require_once('init.php');

    $curl_url = 'https://disqus.com/api/3.0/posts/create.json';
    $author_name = $_POST['name'] == $username ? null : $_POST['name'];
    $author_email = $_POST['email'] == $email ? null : $_POST['email'];
    $author_url = $_POST['url'] == '' || $_POST['url'] == 'null' ? null: $_POST['url'];
    $post_data = array(
        'api_key' => $public_key,
        'thread' => $_POST['thread'],
        'parent' => $_POST['parent'],
        'message' => $_POST['message'],
        'author_name' => $author_name,
        'author_email' => $author_email,
        'author_url' => $author_url
        //'ip_address' => $_SERVER["REMOTE_ADDR"]
    );
    $data = curl_post($curl_url, $post_data);

    $post = $data->response;
    $content = $data -> code != 0 ? $post : post_format($post);;

    $output = array(
       'code' => $data -> code,
       'thread' => $post -> thread,
       'response' => $content
    );

    if ( $_POST['parent'] != '' && $data -> code == 0 ){
        $mail_query = array(
            'parent'=> $_POST['parent'],
            'id'=> $post -> id,
            'link'=> $_POST['link'],
            'title'=> $_POST['title']
        );
        $mail = curl_init();
        $curl_opt = array(
            CURLOPT_URL => 'http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['SCRIPT_NAME']).'/sendemail.php',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $mail_query,
            CURLOPT_TIMEOUT => 1
        );
        curl_setopt_array($mail, $curl_opt);
        curl_exec($mail);
        curl_close($mail);
    }
    print_r(json_encode($output));

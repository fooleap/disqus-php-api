<?php
/**
 * 获取用户资料
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:33:33
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

$output = array(
    'code' => 4,
    'response' => '未登录'
);

if(isset($access_token)){

    $fields_data = array(
        'api_secret' => SECRET_KEY,
        'access_token' => $access_token
    );
    $url = 'https://disqus.com/api/3.0/users/details.json?'.http_build_query($fields_data);
    $ch = curl_init();
    curl_setopt($ch,CURLOPT_URL,$url);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    curl_setopt($ch,CURLOPT_FOLLOWLOCATION,1);
    $data = json_decode(curl_exec($ch));
    curl_close($ch);
    $user_detail = array(
        'avatar' => $data -> response -> avatar -> cache,
        'name' => $data -> response -> name,
        'username' => $data -> response -> username,
        'url' =>  !!$data -> response -> url ? $data -> response -> url : $data -> response -> profileUrl,
        'type' => 1
    );
    $output = array(
        'code' => $data -> code,
        'response' => $user_detail
    );
}

print_r(jsonEncode($output));

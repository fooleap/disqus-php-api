<?php
/**
 * 获取用户资料
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-09-18 16:56:55
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
    $url = 'https://'.$disqus_host.'/api/3.0/users/details.json?'.http_build_query($fields_data);
    $ch = curl_init();
    curl_setopt($ch,CURLOPT_URL,$url);
    curl_setopt($ch,CURLOPT_HTTPHEADER, array('Host: disqus.com', 'Origin: https://disqus.com'));
    curl_setopt($ch,CURLOPT_HEADER,0);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    curl_setopt($ch,CURLOPT_FOLLOWLOCATION,1);

    if (PROXY_MODE == 1) {
      curl_setopt($ch, CURLOPT_PROXY, PROXY);
      curl_setopt($ch, CURLOPT_PROXYTYPE, PROXYTYPE);
      if (PROXYUSERPWD) {
        curl_setopt($ch, CURLOPT_PROXYUSERPWD, PROXYUSERPWD);
      }
    }

    $data = json_decode(curl_exec($ch));
    $errno = curl_errno($ch);

    if ($errno == 60 || $errno == 77) {
        curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = json_decode(curl_exec($ch));
    }
    if( $errno == 51 ){
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        $data = json_decode(curl_exec($ch));
    }
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

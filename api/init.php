<?php
namespace Emojione;
header('Content-type:text/json');
header('Access-Control-Allow-Origin: *');
require_once('config.php');
require_once( dirname(__FILE__) . '/emojione/autoload.php');
$client = new Client(new Ruleset());
$client->imageType = 'png';
$client->imagePathPNG = $emoji_path;

$disqus_host = $gfw_inside ? $disqus_ip : 'disqus.com';

//读取文件
$session_data = json_decode(file_get_contents(sys_get_temp_dir().'/session.json'));
$session = $session_data -> session;
$day = date('Ymd', strtotime('+20 day', strtotime($session_data -> day)));

//20 天前则模拟登录，重新获取 session 并保存
if ( $day < date('Ymd') ){
    $cookie_temp = sys_get_temp_dir().'/cookie_temp.txt';
    $cookie = sys_get_temp_dir().'/cookie.txt';

    $ch = curl_init();

    // 取得 csrftoken
    $options = array(
        CURLOPT_URL => 'https://'.$disqus_host.'/profile/login/',
        CURLOPT_HTTPHEADER => array('Host: disqus.com'),
        CURLOPT_COOKIEJAR => $cookie_temp,
        CURLOPT_HEADER => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    );
    curl_setopt_array($ch, $options);
    $response = curl_exec($ch);

    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
    $cookies = array();
    foreach($matches[1] as $item) {
        parse_str($item, $cookie_temp);
        $cookies = array_merge($cookies, $cookie_temp);
    }
    $token = str_replace("Set-Cookie: csrftoken=", "", $matches[0][0]);

    // 登录并取得 session
    $params = array(
        'csrfmiddlewaretoken' => $token,
        'username' => $email,
        'password' => $password 
    );
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_REFERER, 'https://disqus.com/profile/login/');
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie_temp);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    $result = curl_exec($ch);

    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $result, $output_matches);
    $session = str_replace("Set-Cookie: ", "", $output_matches[0][2]);

    curl_close($ch);

    //写入文件
    $output_date = date('Ymd');
    $output_data = array('day' => $output_date, 'session' => $session);
    $output_string = json_encode($output_data);
    file_put_contents(sys_get_temp_dir().'/session.json', $output_string);
}

function curl_get($url){
    global $session, $disqus_host;
    $curl_url = 'https://'.$disqus_host.$url;

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: disqus.com'),
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $data = json_decode(curl_exec($curl));
    curl_close($curl);
    return $data;
}

function curl_post($url, $data){
    global $session, $disqus_host;

    $curl_url = strpos($url, 'https') !== false ? $url : 'https://'.$disqus_host.$url;
    $curl_host = strpos($url, 'https') !== false ? 'uploads.services.disqus.com' : 'disqus.com';

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: '.$curl_host),
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $data = json_decode(curl_exec($curl));
    curl_close($curl);
    return $data;
}

function post_format( $post ){
    global $client, $gravatar_cdn, $gravatar_default;

    // 访客指定 Gravatar 头像
    $avatar_url = $gravatar_cdn.md5($post->author->email).'?d='.$gravatar_default;
    $post->author->avatar->cache = $post->author->isAnonymous ? $avatar_url : $post->author->avatar->cache;

    // 表情
    $post->message = $client->unicodeToImage($post->message);

    // 去除链接重定向
    $urlPat = '/<a.*?href="(.*?disq\.us.*?)".*?>(.*?)<\/a>/i';
    preg_match_all($urlPat, $post->message, $urlArr);    
    if( count($urlArr[0]) > 0 ){
        foreach ( $urlArr[1] as $item => $urlItem){
            parse_str(parse_url($urlItem,PHP_URL_QUERY),$out);
            $linkArr[$item] = '<a href="'.join(':', explode(':',$out['url'],-1)).'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
        }
        $post->message = str_replace($urlArr[0],$linkArr,$post->message);
    }

    // 去掉图片链接
    $imgpat = '/<a(.*?)href="(.*?\.(jpg|gif|png))"(.*?)>(.*?)<\/a>/i';
    $post->message = preg_replace($imgpat,'',$post->message);

    $imgArr = array();
    foreach ( $post -> media as $key => $image ){
        $imgArr[$key] = $image -> url;
    };

    $data = array( 
        'avatar' => $post -> author -> avatar -> cache,
        'createdAt' => $post -> createdAt.'+00:00',
        'id'=> $post -> id,
        'media' => $imgArr,
        'message'=> $post -> message,
        'name' => $post -> author -> name,
        'parent' => $post -> parent,
        'url' => $post -> author -> url
    );

    return $data;
}

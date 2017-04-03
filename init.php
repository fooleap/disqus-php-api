<?php
namespace Emojione;
header('Content-type:text/json');
header('Access-Control-Allow-Origin: *');
require_once( dirname(__FILE__) . '/emojione/autoload.php');
$client = new Client(new Ruleset());
$client->imageType = 'png';
$client->imagePathPNG = '//assets-cdn.github.com/images/icons/emoji/unicode/';

$public_key = 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F'; // Disqus 评论框或官网的 Public Key 
$origin = ''; // 域名如 http://blog.fooleap.org
$forum = ''; // forum id 如 fooleap
$username = ''; // 个人昵称 如 fooleap 为了自己发表评论是登录状态，postcomment 有相关的判断
$email = ''; // Disqus 账号，邮箱号
$password = ''; // Disqus 密码

//读取文件
$session_data = json_decode(file_get_contents(sys_get_temp_dir().'/session.json'));
$session = $session_data -> session;
$day = date('Ymd', strtotime('+20 day', strtotime($session_data -> day)));

//20 天前则模拟登录，重新获取 session 并保存
if ( $day < date('Ymd') ){
    // 取得 csrftoken
    $url = "https://disqus.com/profile/login/";
    $cookie = "cookie.txt";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 1);
    $response = curl_exec($ch);
    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
    $cookies = array();
    foreach($matches[1] as $item) {
        parse_str($item, $cookie);
        $cookies = array_merge($cookies, $cookie);
    }
    $token = str_replace("Set-Cookie: csrftoken=", "", $matches[0][0]);

    //取得 session
    curl_setopt($ch, CURLOPT_REFERER, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie);
    $params = array(
        'csrfmiddlewaretoken' => $token,
        'username' => $email,
        'password' => $password 
    );
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
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
    global $session;

    $options = array(
        CURLOPT_URL => $url,
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_RETURNTRANSFER => true
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $data = json_decode(curl_exec($curl));
    curl_close($curl);
    return $data;
}

function curl_post($url, $data){
    global $session;

    $options = array(
        CURLOPT_URL => $url,
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $data = json_decode(curl_exec($curl));
    curl_close($curl);
    return $data;
}

function post_format( $post ){
    global $client;

    // 访客指定 Gravatar 头像
    $avatar_url = '//cdn.v2ex.com/gravatar/'.md5($post->author->email).'?d=https://a.disquscdn.com/images/noavatar92.png';
    $post->author->avatar->cache = $post->author->isAnonymous ? $avatar_url : $post->author->avatar->cache;

    //Emoji
    $post->message = $client->shortnameToImage($post->message);

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

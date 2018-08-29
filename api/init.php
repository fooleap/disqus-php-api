<?php
/**
 * 获取权限，简单封装常用函数
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-30 01:35:21
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('config.php');
require_once('cache.php');
require_once('jwt.php');
require_once('emoji.php');

error_reporting(E_ERROR | E_PARSE);
header('Content-type:text/json');
header('Access-Control-Allow-Credentials: true');
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';  
$ipRegex = '((2[0-4]|1\d|[1-9])?\d|25[0-5])(\.(?1)){3}';
function domain($url){
    preg_match('/[a-z0-9\-]{1,63}\.[a-z\.]{2,6}$/', parse_url($url, PHP_URL_HOST), $_domain_tld);
    return $_domain_tld[0];
}
if(preg_match('(localhost|'.$ipRegex.'|'.domain(DISQUS_WEBSITE).')', $origin)){
    header('Access-Control-Allow-Origin: '.$origin);
}

try {
    $cache = new Cache();
} catch (Exception $e) {
    die('没有权限');
}

$jwt = new JWT();
$emoji = new Emoji();

$approved = DISQUS_APPROVED == 1 ? 'approved' : null;
$url = parse_url(DISQUS_WEBSITE);
$website = $url['scheme'].'://'.$url['host'];

$user = $_COOKIE['access_token'];

if ( isset($user) ){

    $userData = $jwt -> decode($user, DISQUS_PASSWORD);

    if( $userData ){

        $refresh_token = $userData['refresh_token'];
        $access_token = $userData['access_token'];

        if( $userData['exp'] < $_SERVER['REQUEST_TIME'] + 3600 * 20 * 24){

            $authorize = 'refresh_token';
            $fields = (object) array(
                'grant_type' => urlencode($authorize),
                'client_id' => urlencode(PUBLIC_KEY),
                'client_secret' => urlencode(SECRET_KEY),
                'refresh_token' => urlencode($refresh_token)
            );

            getAccessToken($fields);
        }

    }
}

function adminLogin(){

    global $cache;

    $fields = (object) array(
        'username' => DISQUS_EMAIL,
        'password' => DISQUS_PASSWORD
    );

    $fields_string = fields_format($fields);

    $options = array(
        CURLOPT_URL => 'https://import.disqus.com/login/',
        CURLOPT_HEADER => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_POST => count($fields),
        CURLOPT_POSTFIELDS => $fields_string
    );

    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $result = curl_exec($curl);
    $errno = curl_errno($curl);

    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }

    curl_close($curl);
    preg_match('/^Set-Cookie:\s+(session.*)/mi', $result, $matches);
    $cookieArr =  explode('; ',$matches[1]);
    $cookie = (object) array();

    foreach( $cookieArr as $value){

        if( strpos($value,'=') !== false){
            list($key, $val) = explode('=', $value);
            $cookie -> $key = $val;
        }

    }

    // 更新缓存
    $cache -> update($cookie,'cookie');

}

// 鉴权
function getAccessToken($fields){
    global $access_token, $jwt;

    extract($_POST);
    $url = 'https://disqus.com/api/oauth/2.0/access_token/?';

    $fields_string = fields_format($fields);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, count($fields));
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields_string);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);
    curl_close($ch);

    // 用户授权数据
    $auth_results = json_decode($data);

    // 换算过期时间
    $expires = $_SERVER['REQUEST_TIME'] + $auth_results -> expires_in;

    // 重新获取授权码
    $access_token = $auth_results -> access_token;

    $payload = (array) $auth_results;
    $payload['iss'] = DISQUS_EMAIL;
    $payload['iat'] = $_SERVER['REQUEST_TIME'];
    $payload['exp'] = $expires;

    setcookie('access_token', $jwt -> encode($payload, DISQUS_PASSWORD), $expires, substr(__DIR__, strlen($_SERVER['DOCUMENT_ROOT'])), $_SERVER['HTTP_HOST'], false, true); 

    return $access_token;
}

function encodeURIComponent($str){
    $replacers = [
        '%21' => '!',
        '%2A' => '*',
        '%27' => "'",
        '%28' => '(',
        '%29' => ')'
    ];
    if (!is_string($str)) return $str;
    return strtr(rawurlencode($str), $replacers);
}

function email_format($email){
    $index = strrpos($email, '@');
    $start = $index > 1 ? 1 : 0;
    $length = $index - $start;
    $star = str_repeat('*', $length);
    return substr_replace($email, $star, $start, $length);
}

function fields_format($fields){
    foreach($fields as $key=>$value) { 
        if (is_array($value)) {
            foreach( $value as $item ){
                $fields_string .= encodeURIComponent($key).'='.encodeURIComponent($item).'&';
            }
        } else {
            $fields_string .= encodeURIComponent($key).'='.encodeURIComponent($value).'&';
        }
    }
    $fields_string = rtrim($fields_string, '&');
    return $fields_string;
}

function curl_get($url, $fields){

    global $cache;

    $fields -> api_key = DISQUS_PUBKEY;
    $cookies = 'sessionid='.$cache -> get('cookie') -> sessionid;

    $fields_string = fields_format($fields);

    $curl_url = 'https://disqus.com'.$url.$fields_string;

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: disqus.com','Origin: https://disqus.com'),
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_FOLLOWLOCATION => 1,
        CURLOPT_HEADER => 0,
        CURLOPT_RETURNTRANSFER => 1 
    );

    $curl = curl_init();
    curl_setopt_array($curl, $options);

    if( isset($cookies)){
        curl_setopt($curl, CURLOPT_COOKIE, $cookies);
    }

    $data = curl_exec($curl);
    $errno = curl_errno($curl);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }
    curl_close($curl);

    return json_decode($data);
}

function curl_post($url, $fields){

    global $access_token, $cache;

    if( isset($access_token) && strpos($url, 'threads/create') === false && strpos($url, 'media') === false ){

        $fields -> api_secret = SECRET_KEY;
        $fields -> access_token = $access_token;

    } else {

        $fields -> api_key = DISQUS_PUBKEY;
        $cookies = 'sessionid='.$cache -> get('cookie') -> sessionid;
    }

    if( strpos($url, 'media') !== false ){

        $curl_url = 'https://uploads.services.disqus.com'.$url;
        $curl_host = 'uploads.services.disqus.com';

        $fields_string = $fields;

    } else {

        $curl_url = 'https://disqus.com'.$url;
        $curl_host = 'disqus.com';

        $fields_string = fields_format($fields);
    }

    $curl = curl_init();
    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: '.$curl_host,'Origin: https://disqus.com'),
        CURLOPT_HEADER => 0,
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_FOLLOWLOCATION => 1,
        CURLOPT_POST => count($fields),
        CURLOPT_POSTFIELDS => $fields_string
    );

    curl_setopt_array($curl, $options);

    if( isset($cookies)){
        curl_setopt($curl, CURLOPT_COOKIE, $cookies);
    }

    $data = curl_exec($curl);
    $errno = curl_errno($curl);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }
    curl_close($curl);

    return json_decode($data);
}

function forum_format( $forum ){
    $modText = $forum -> moderatorBadgeText;
    $avatar = $forum -> avatar -> large -> cache;
    return (object) array(
        'founder' => $forum -> founder,
        'name' => $forum -> name,
        'url' => $forum -> url,
        'id' => $forum -> id,
        'avatar' => substr($avatar, 0, 2) === '//' ? 'https:'.$avatar : $avatar,
        'moderatorBadgeText' =>  !!$modText ? $modText : '管理员',
    );
}

function thread_format( $thread ){
    return (object) array(
        'author' => $thread -> author,
        'dislikes' => $thread -> dislikes,
        'id' => $thread -> id,
        'identifiers' => $thread -> identifiers,
        'likes' => $thread -> likes,
        'link' => $thread -> link,
        'posts' => $thread -> posts,
        'title' => $thread -> clean_title
    );
}


function post_format( $post ){
    global $emoji, $cache;

    $author = $post -> author;

    // 是否是管理员
    $isMod = ($author -> username == DISQUS_USERNAME || $author -> email == DISQUS_EMAIL ) && $author -> isAnonymous == false ? true : false;

    $uid = md5($author -> name.$author -> email);

    // 访客数据
    $authors = $cache -> get('authors');
    $email = isset($authors -> $uid) ? $authors -> $uid : $author -> name;

    // 访客指定 Gravatar 头像
    $avatar = $cache -> get('forum') -> avatar;

    if( defined('GRAVATAR_DEFAULT') ){
        $avatar_default = GRAVATAR_DEFAULT;
    } else {
        $avatar_default = substr($avatar, 0, 2) === '//' ? 'https:'.$avatar : $avatar;
    }

    if($author -> isAnonymous){
        $author -> avatar -> cache = GRAVATAR_CDN.md5($email).'?d='.$avatar_default.'&s=92';
    }

    // 表情
    $post -> message = $emoji -> toImage($post -> message);

    // 链接
    $author -> url = !!$author -> url ? $author -> url : $author -> profileUrl;

    $urlPat = '/<a.*?href="(.*?[disq\.us][disqus\.com][disquscdn\.com][media.giphy\.com].*?)".*?>(.*?)<\/a>/mi';
    preg_match_all($urlPat, $post -> message, $urlArr);    
    if( count($urlArr[0]) > 0 ){
        $linkArr = array();
        foreach ( $urlArr[1] as $item => $urlItem){
            // 去除链接重定向
            if(preg_match('/^(http|https):\/\/disq\.us/i', $urlItem)){
                parse_str(parse_url($urlItem,PHP_URL_QUERY),$out);
                $linkArr[$item] = '<a href="'.join(':', explode(':',$out['url'],-1)).'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
            // 去掉图片链接
            } elseif ( preg_match('/^(http|https):\/\/.*(disquscdn.com|media.giphy.com).*\.(jpg|gif|png)$/i', $urlItem) ){
                $linkArr[$item] = '';
            } elseif ( strpos($urlItem, 'https://disqus.com/by/') !== false ){
                $linkArr[$item] = '<a href="'.$urlItem.'" target="_blank" title="'.$urlArr[2][$item].'">@'.$urlArr[2][$item].'</a>';
            } else {
                $linkArr[$item] = '<a href="'.$urlItem.'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
            }
        }
        $post -> message = str_replace($urlArr[0],$linkArr,$post -> message);
    }

    $imgArr = array();
    foreach ( $post -> media as $key => $image ){
        
        $imgArr[$key] = (object) array(
            'thumbUrl' => $image -> thumbnailUrl,
            'thumbWidth' => $image -> thumbnailWidth,
            'thumbHeight' => $image -> thumbnailHeight,
            'provider' => $image -> providerName
        );

        if( $image -> url !== 'https://disqus.com' && $image -> url !== 'disqus.com' ){
            $imgArr[$key] = $image -> thumbnailUrl;
        }
    };
    $imgArr = array_reverse($imgArr);

    // 是否已删除
    if(!!$post -> isDeleted){
        $post -> message = '';
        $author -> avatar -> cache =  $avatar;
        $author -> username = '';
        $author -> name = '';
        $author -> url = '';
        $isMod = '';
    }

    return (object) array( 
        'avatar' => $author -> avatar -> cache,
        'isMod' => $isMod,
        'isDeleted' => $post -> isDeleted,
        'username' => $author -> username,
        'createdAt' => $post -> createdAt.'+00:00',
        'id' => $post -> id,
        'media' => $imgArr,
        'message' => $post -> message,
        'name' => $author -> name,
        'url' => $author -> url,
        'parent' => $post -> parent
    );
}

function getForumData(){

    global $cache;

    $fields = (object) array(
        'forum' => DISQUS_SHORTNAME
    );
    $curl_url = '/api/3.0/forums/details.json?';
    $data = curl_get($curl_url, $fields);
    
    if( $data -> code == 0 ){
        $forum = forum_format($data -> response);
        $forum -> expires = time() + 3600*24;
        $cache -> update($forum,'forum');
    }
}

// 取得当前目录
function getCurrentDir (){

    $isSecure = false;
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
        $isSecure = true;
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https' || !empty($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] == 'on') {
        $isSecure = true;
    }

    $protocol = $isSecure ? 'https://' : 'http://';

    return $protocol.$_SERVER['HTTP_HOST'].substr(__DIR__, strlen($_SERVER['DOCUMENT_ROOT']));

}

if( time() > strtotime($cache -> get('cookie') -> expires) || !$cache -> get('cookie') ){
    adminLogin();
}

if( time() > $cache -> get('forum') -> expires || !$cache -> get('forum')){
    getForumData();
}

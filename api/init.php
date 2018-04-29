<?php
/**
 * 获取权限，简单封装常用函数
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-04-29 17:25:43
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('config.php');
require_once('emojione/autoload.php');

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

// Emoji 表情设置
$client = new Client(new Ruleset());
$client -> ignoredRegexp = '<code[^>]*>.*?<\/code>|<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>';
$client -> unicodeRegexp = '(?:\x{1F3F3}\x{FE0F}?\x{200D}?\x{1F308}|\x{1F441}\x{FE0F}?\x{200D}?\x{1F5E8}\x{FE0F}?)|[\x{0023}-\x{0039}]\x{FE0F}?\x{20e3}|[\x{1F1E0}-\x{1F1FF}]{2}|(?:[\x{1F468}\x{1F469}])\x{FE0F}?[\x{1F3FA}-\x{1F3FF}]?\x{200D}?(?:[\x{2695}\x{2696}\x{2708}\x{1F4BB}\x{1F4BC}\x{1F527}\x{1F52C}\x{1F680}\x{1F692}\x{1F33E}-\x{1F3ED}])|(?:[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}][\x{200D}\x{FE0F}]+){1,3}[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}]|(?:[\x{2764}\x{1F466}-\x{1F469}\x{1F48B}]\x{FE0F}?){2,4}|(?:[\x{1f46e}\x{1F468}\x{1F469}\x{1f575}\x{1f471}-\x{1f487}\x{1F645}-\x{1F64E}\x{1F926}\x{1F937}]|[\x{1F460}-\x{1F482}\x{1F3C3}-\x{1F3CC}\x{26F9}\x{1F486}\x{1F487}\x{1F6A3}-\x{1F6B6}\x{1F938}-\x{1F93E}]|\x{1F46F})\x{FE0F}?[\x{1F3FA}-\x{1F3FF}]?\x{200D}?[\x{2640}\x{2642}]?\x{FE0F}?|(?:[\x{26F9}\x{261D}\x{270A}-\x{270D}\x{1F385}-\x{1F3CC}\x{1F442}-\x{1F4AA}\x{1F574}-\x{1F596}\x{1F645}-\x{1F64F}\x{1F6A3}-\x{1F6CC}\x{1F918}-\x{1F93E}]\x{FE0F}?[\x{1F3FA}-\x{1F3FF}])|(?:[\x{2194}-\x{2199}\x{21a9}-\x{21aa}]\x{FE0F}?|[\x{3030}\x{303d}]\x{FE0F}?|(?:[\x{1F170}-\x{1F171}]|[\x{1F17E}-\x{1F17F}]|\x{1F18E}|[\x{1F191}-\x{1F19A}]|[\x{1F1E6}-\x{1F1FF}])\x{FE0F}?|\x{24c2}\x{FE0F}?|[\x{3297}\x{3299}]\x{FE0F}?|(?:[\x{1F201}-\x{1F202}]|\x{1F21A}|\x{1F22F}|[\x{1F232}-\x{1F23A}]|[\x{1F250}-\x{1F251}])\x{FE0F}?|[\x{203c}\x{2049}]\x{FE0F}?|[\x{25aa}-\x{25ab}\x{25b6}\x{25c0}\x{25fb}-\x{25fe}]\x{FE0F}?|[\x{00a9}\x{00ae}]\x{FE0F}?|[\x{2122}\x{2139}]\x{FE0F}?|\x{1F004}\x{FE0F}?|[\x{2b05}-\x{2b07}\x{2b1b}-\x{2b1c}\x{2b50}\x{2b55}]\x{FE0F}?|[\x{231a}-\x{231b}\x{2328}\x{23cf}\x{23e9}-\x{23f3}\x{23f8}-\x{23fa}]\x{FE0F}?|\x{1F0CF}|[\x{2934}\x{2935}]\x{FE0F}?)|[\x{2700}-\x{27bf}]\x{FE0F}?|[\x{1F000}-\x{1F6FF}\x{1F900}-\x{1F9FF}]\x{FE0F}?|[\x{2600}-\x{26ff}]\x{FE0F}?|[\x{0030}-\x{0039}]\x{FE0F}';
$client -> imageType = 'png';
$client -> imagePathPNG = EMOJI_PATH;

$approved = DISQUS_APPROVED == 1 ? 'approved' : null;
$url = parse_url(DISQUS_WEBSITE);
$website = $url['scheme'].'://'.$url['host'];

// 缓存文件
$data_path = sys_get_temp_dir().'/disqus_'.DISQUS_SHORTNAME.'.json';
$forum_data = json_decode(file_get_contents($data_path));

function adminLogin(){

    global $data_path, $forum_data;

    $fields = (object) array(
        'username' => DISQUS_EMAIL,
        'password' => DISQUS_PASSWORD
    );

    $options = array(
        CURLOPT_URL => 'https://import.disqus.com/login/',
        CURLOPT_HEADER => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_POST => 1,
        CURLOPT_POSTFIELDS => http_build_query($fields)
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

    $forum_data -> cookie = $cookie;

    file_put_contents($data_path, json_encode($forum_data));
}

// 鉴权
function getAccessToken($fields){
    global $data_path, $forum_data, $access_token;

    extract($_POST);
    $url = 'https://disqus.com/api/oauth/2.0/access_token/?';

    $fields_string = fields_format($fields);

    $ch = curl_init();
    curl_setopt($ch,CURLOPT_URL,$url);
    curl_setopt($ch,CURLOPT_POST,count($fields));
    curl_setopt($ch,CURLOPT_POSTFIELDS,$fields_string);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    $data = curl_exec($ch);
    curl_close($ch);

    // 用户授权数据
    $auth_results = json_decode($data);

    // 换算过期时间
    $auth_results -> expires = time() + $auth_results -> expires_in;

    // 重新获取授权码
    $access_token = $auth_results -> access_token;

    // user_id 写入 cookie，并设置过期时间为 30 天
    $user_id = $auth_results -> user_id;
    setcookie('user_id', $user_id, time() + 3600*24*30);

    // 写入文件缓存
    $forum_data -> users -> $user_id = $auth_results;
    file_put_contents($data_path, json_encode($forum_data));

    return $user_id;
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

    global $forum_data;

    if( defined(ACCESS_TOKEN) ){

        $fields -> api_secret = SECRET_KEY;
        $fields -> access_token = ACCESS_TOKEN;

    } else {

        $fields -> api_key = DISQUS_PUBKEY;
        $cookies = 'sessionid='.$forum_data -> cookie -> sessionid;

    }

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

    global $access_token, $forum_data;

    if( isset($access_token) && strpos($url, 'threads/create') === false && strpos($url, 'media') === false ){

        $fields -> api_secret = SECRET_KEY;
        $fields -> access_token = $access_token;

    } else {

        $fields -> api_key = DISQUS_PUBKEY;
        $cookies = 'sessionid='.$forum_data -> cookie -> sessionid;
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
        CURLOPT_POST => 1,
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

function post_format( $post ){
    global $client, $forum_data;

    // 是否是管理员
    $isMod = ($post -> author -> username == DISQUS_USERNAME || $post -> author -> email == DISQUS_EMAIL ) && $post -> author -> isAnonymous == false ? true : false;

    // 访客指定 Gravatar 头像
    $avatar_default = strpos($forum_data -> forum -> avatar, 'https') !== false ? $forum_data -> forum -> avatar : 'https:'.$forum_data -> forum -> avatar;
    $avatar_url = GRAVATAR_CDN.md5($post -> author -> email).'?d='.$avatar_default;
    $post -> author -> avatar -> cache = $post -> author -> isAnonymous ? $avatar_url : $post -> author -> avatar -> cache;

    // 表情
    $post -> message = str_replace('<img class="emojione"','<img class="emojione" width="24" height="24"',$client -> toImage($post -> message));

    // 链接
    $post -> author -> url = !!$post -> author -> url ? $post -> author -> url : $post -> author -> profileUrl;

    // 去除链接重定向
    $urlPat = '/<a.*?href="(.*?[disq\.us][disqus\.com].*?)".*?>(.*?)<\/a>/mi';
    preg_match_all($urlPat, $post -> message, $urlArr);    
    if( count($urlArr[0]) > 0 ){
        $linkArr = array();
        foreach ( $urlArr[1] as $item => $urlItem){
            if(preg_match('/^(http|https):\/\/disq\.us/i', $urlItem)){
                parse_str(parse_url($urlItem,PHP_URL_QUERY),$out);
                $linkArr[$item] = '<a href="'.join(':', explode(':',$out['url'],-1)).'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
            } elseif ( strpos($urlItem, 'https://disqus.com/by/') !== false ){
                $linkArr[$item] = '<a href="'.$urlItem.'" target="_blank" title="'.$urlArr[2][$item].'">@'.$urlArr[2][$item].'</a>';
            } else {
                $linkArr[$item] = '<a href="'.$urlItem.'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
            }
        }
        $post -> message = str_replace($urlArr[0],$linkArr,$post -> message);
    }

    // 去掉图片链接
    $imgpat = '/<a(.*?)href="(.*?(disquscdn.com|media.giphy.com).*?\.(jpg|gif|png))"(.*?)>(.*?)<\/a>/i';
    $post -> message = preg_replace($imgpat,'',$post -> message);

    $imgArr = array();
    foreach ( $post -> media as $key => $image ){
        if( $image -> url !== 'https://disqus.com' && $image -> url !== 'disqus.com' ){
            if( strpos($image -> url, 'giphy.gif') !== false ){
                $imgArr[$key] = '//a.disquscdn.com/get?url='.urlencode($image -> url).'&key=Hx_Z1IMzKElPuRPVmpnfsQ';
            } else {
                $imgArr[$key] = $image -> url;
            }
        }
    };
    $imgArr = array_reverse($imgArr);

    // 是否已删除
    if(!!$post -> isDeleted){
        $post -> message = '';
        $post -> author -> avatar -> cache = GRAVATAR_CDN.'?d='.$avatar_default;
        $post -> author -> username = '';
        $post -> author -> name = '';
        $post -> author -> url = '';
        $isMod = '';
    }

    $data = array( 
        'avatar' => $post -> author -> avatar -> cache,
        'isMod' => $isMod,
        'isDeleted' => $post -> isDeleted,
        'username' => $post -> author -> username,
        'createdAt' => $post -> createdAt.'+00:00',
        'id' => $post -> id,
        'media' => $imgArr,
        'message' => $post -> message,
        'name' => $post -> author -> name,
        'parent' => $post -> parent,
        'url' => $post -> author -> url
    );

    return $data;
}

function getUserData(){
    global $access_token;

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
    return json_encode($output);
}

function getForumData(){

    global $data_path, $forum_data;

    $fields = (object) array(
        'forum' => DISQUS_SHORTNAME
    );
    $curl_url = '/api/3.0/forums/details.json?';
    $data = curl_get($curl_url, $fields);
    $forum = array(
        'founder' => $data -> response -> founder,
        'name' => $data -> response -> name,
        'url' => $data -> response -> url,
        'avatar' => $data -> response -> avatar -> large -> cache,
        'moderatorBadgeText' =>  $data -> response -> moderatorBadgeText,
        'expires' => time() + 3600*24
    );
    if( $data -> code == 0 ){
        $forum_data -> forum = $forum;
        file_put_contents($data_path, json_encode($forum_data));
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

if( time() > strtotime($forum_data -> cookie -> expires) || !$forum_data -> cookie){
    adminLogin();
}

if( time() > $forum_data -> forum -> expires || !$forum_data -> forum){
    getForumData();
}

$user_id = $_COOKIE['user_id'];

if ( isset($user_id) ){

    // 取用户授权数据，可能为空
    $auth_results = $forum_data -> users -> $user_id;

    if( isset($auth_results) ){

        // 取刷新码和过期时间
        $refresh_token = $auth_results -> refresh_token;
        $auth_expires = $auth_results -> expires;
        $access_token = $auth_results -> access_token;

        // 离过期少于 20 天
        if( $auth_expires - time() < 3600 * 20 ){

            $authorize = 'refresh_token';
            $fields = array(
                'grant_type'=>urlencode($authorize),
                'client_id'=>urlencode($PUBLIC_KEY),
                'client_secret'=>urlencode($SECRET_KEY),
                'refresh_token'=>urlencode($refresh_token)
            );

            getAccessToken($fields);
        }
    }
}

<?php
/**
 * 获取权限，简单封装常用函数
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-11-06 13:37:06
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
if($_SERVER['REQUEST_METHOD'] == 'OPTIONS')
{
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])){
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
    }

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])){
        header('Access-Control-Allow-Headers: '.$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']);
    }
    exit(0);
}

try {
    $cache = new Cache();
} catch (Exception $e) {
    die('没有权限，请检查设置当前目录写权限，或将 config.php 中的 USE_TEMP 设置为 true');
}

$jwt = new JWT();
$emoji = new Emoji();

$disqus_host = IP_MODE == 1 && PROXY_MODE == 0 ? DISQUS_IP : 'disqus.com';
$media_host = IP_MODE == 1 && PROXY_MODE == 0 ? DISQUS_MEDIAIP  : 'uploads.services.disqus.com';
$login_host = IP_MODE == 1 && PROXY_MODE == 0 ? DISQUS_LOGINIP  : 'import.disqus.com';
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

function jsonEncode($array){
    return json_encode($array, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
}

function adminLogin(){

    global $cache, $login_host;

    $fields = (object) array(
        'username' => DISQUS_EMAIL,
        'password' => DISQUS_PASSWORD
    );

    $fields_string = fields_format($fields);

    $options = array(
        CURLOPT_URL => 'https://'.$login_host.'/login/',
        CURLOPT_HTTPHEADER => array('Host: import.disqus.com', 'Origin: https://disqus.com'),
        CURLOPT_HEADER => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_POST => count($fields),
        CURLOPT_POSTFIELDS => $fields_string
    );

    $curl = curl_init();
    curl_setopt_array($curl, $options);

    if (PROXY_MODE == 1) {
      curl_setopt($curl, CURLOPT_PROXY, PROXY);
      curl_setopt($curl, CURLOPT_PROXYTYPE, PROXYTYPE);
      if (PROXYUSERPWD) {
        curl_setopt($curl, CURLOPT_PROXYUSERPWD, PROXYUSERPWD);
      }
    }

    $result = curl_exec($curl);
    $errno = curl_errno($curl);

    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $result = curl_exec($curl);
    }

    if( $errno == 51 ){
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
        $result = curl_exec($curl);
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
    global $access_token, $jwt, $disqus_host;

    extract($_POST);
    $url = 'https://'.$disqus_host.'/api/oauth/2.0/access_token/?';

    $fields_string = fields_format($fields);

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Host: disqus.com', 'Origin: https://disqus.com'));
    curl_setopt($curl, CURLOPT_POST, count($fields));
    curl_setopt($curl, CURLOPT_POSTFIELDS, $fields_string);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    if (PROXY_MODE == 1) {
      curl_setopt($curl, CURLOPT_PROXY, PROXY);
      curl_setopt($curl, CURLOPT_PROXYTYPE, PROXYTYPE);
      if (PROXYUSERPWD) {
        curl_setopt($curl, CURLOPT_PROXYUSERPWD, PROXYUSERPWD);
      }
    }

    $data = curl_exec($curl);
    $errno = curl_errno($curl);

    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }

    if( $errno == 51 ){
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
        $data = curl_exec($curl);
    }
    curl_close($curl);

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

if(!function_exists("array_column"))
{
    function array_column($array,$column_name)
    {
        return array_map(function($element) use($column_name){return $element[$column_name];}, $array);
    }
}

function get_ip(){
    $ip = '';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    if(strpos($ip, ':') !== false ){
      return null;
    }
    return preg_regex('/[\d\.]+/', $ip);
}

function preg_regex($pattern, $str)
{
    preg_match($pattern, $str, $matches);
    return array_pop($matches);
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

function curl_get($url, $fields = array()){

    global $cache, $disqus_host;

    if( isset($access_token) && strpos($url, 'threadReactions/loadReactions') !== false ){

        $fields -> api_secret = SECRET_KEY;
        $fields -> access_token = $access_token;

    } else {

        $fields -> api_key = DISQUS_PUBKEY;
        $cookies = 'sessionid='.$cache -> get('cookie') -> sessionid;
    }

    if( strpos($url, 'threads/listUsersVotedThread') !== false || strpos($url, 'threadReactions/loadReactions') !== false ){
        unset($cookies);
    }

    $fields_string = fields_format($fields);

    $curl_url = 'https://'.$disqus_host.$url.$fields_string;

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: disqus.com','Origin: https://disqus.com'),
        CURLOPT_FOLLOWLOCATION => 1,
        CURLOPT_HEADER => 0,
        CURLOPT_RETURNTRANSFER => 1 
    );

    $curl = curl_init();
    curl_setopt_array($curl, $options);

    if( isset($cookies)){
        curl_setopt($curl, CURLOPT_COOKIE, $cookies);
    }

    if (PROXY_MODE == 1) {
      curl_setopt($curl, CURLOPT_PROXY, PROXY);
      curl_setopt($curl, CURLOPT_PROXYTYPE, PROXYTYPE);
      if (PROXYUSERPWD) {
        curl_setopt($curl, CURLOPT_PROXYUSERPWD, PROXYUSERPWD);
      }
    }

    $data = curl_exec($curl);
    $errno = curl_errno($curl);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }
    if( $errno == 51 ){
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
        $data = curl_exec($curl);
    }
    curl_close($curl);

    return json_decode($data);
}

function curl_post($url, $fields){

    global $access_token, $cache, $disqus_host, $media_host;

    if( isset($access_token) && strpos($url, 'threads/create') === false && strpos($url, 'media/create') === false ){

        $fields -> api_secret = SECRET_KEY;
        $fields -> access_token = $access_token;

    } else {

        $fields -> api_key = DISQUS_PUBKEY;
        $cookies = 'sessionid='.$cache -> get('cookie') -> sessionid;
        if( isset($fields -> unique) ){
            $cookies = 'disqus_unique='.$fields -> unique;
        } 
    }
    unset($fields -> unique);


    if( strpos($url, 'media/create') !== false ){

        $curl_url = 'https://'.$media_host.$url;
        $curl_host = 'uploads.services.disqus.com';

        $fields_string = $fields;

    } else {

        $curl_url = 'https://'.$disqus_host.$url;
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

    if (PROXY_MODE == 1) {
      curl_setopt($curl, CURLOPT_PROXY, PROXY);
      curl_setopt($curl, CURLOPT_PROXYTYPE, PROXYTYPE);
      if (PROXYUSERPWD) {
        curl_setopt($curl, CURLOPT_PROXYUSERPWD, PROXYUSERPWD);
      }
    }

    $data = curl_exec($curl);
    $errno = curl_errno($curl);

    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }
    if( $errno == 51 ){
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
        $data = curl_exec($curl);
    }
    curl_close($curl);

    return json_decode($data);
}

function thread_format( $thread ){
    return (object) array(
        'author' => $thread -> author,
        'dislikes' => $thread -> dislikes,
        'id' => $thread -> id,
        'slug' => $thread -> slug,
        'identifiers' => $thread -> identifiers,
        'likes' => $thread -> likes,
        'link' => $thread -> link,
        'posts' => $thread -> posts,
        'title' => $thread -> clean_title,
        'createdAt' => $thread -> createdAt.'+00:00'
    );
}

function media_format( $media ){
    if( $media -> html == '' ){
        $media -> html = '<div class="comment-item-image"><a href="'.$media -> url.'" target="_blank" rel="nofollow" title="'.$media -> title.'" ><img src="https:'. $media -> thumbnailUrl .'" /></a></div>';
    }
    return $media;
}

function realUrl($url)
{
    $url = htmlspecialchars_decode(urldecode($url));
    return preg_replace('/^(http|https):\/\/disq\.us\/url\?url=(.*?):[A-Za-z0-9_-]{27}&cuid=\d*/', '$2', $url);
}

function post_format( $post ){
    global $emoji, $cache;

    $author = $post -> author;

    $modIdent = defined('MOD_IDENT') ? MOD_IDENT : 1;

    switch($modIdent){
    case 1:
        $isMod = $author -> username == DISQUS_USERNAME;
        break;
    case 2:
        $isMod = $author -> name == DISQUS_USERNAME && $author -> email == DISQUS_EMAIL;
        break;
    case 3:
        $isMod = $author -> name == DISQUS_USERNAME || $author -> email == DISQUS_EMAIL;
        break;
    default:
        $isMod = $author -> username == DISQUS_USERNAME;
    }

    $uid = md5($author -> name.$author -> email);

    // 访客数据
    $authors = $cache -> get('authors');
    $email = isset($authors -> $uid) ? $authors -> $uid : $author -> name;

    // 访客指定 Gravatar 头像
    $avatar = $cache -> get('forum') -> avatar;
    $avatar = strpos($avatar, 'noavatar92') !== false ? 'https://a.disquscdn.com/images/noavatar92.png' : $avatar;

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

    // 链接及图片
    $urlPat = '/<a.*?href="(.*?)".*?title="(.*?)".*?>(.*?)<\/a>/mi';
    if( preg_match_all($urlPat, $post -> message, $urlMatches) ){
        $urlMatches[1] = array_map('realUrl', $urlMatches[1]);
        $mediaUrl = array_filter(array_column($post -> media, 'url'), function($var) {
            return preg_match('/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})\/?$/i', $var) == false;
        });
        foreach( $urlMatches[0] as $key => $item ){
            $imgKey = array_search($urlMatches[1][$key], $mediaUrl );
            $linkItem = '<a href="'.$urlMatches[1][$key].'" title="'.$urlMatches[2][$key].'" target="_blank" rel="nofollow">'.$urlMatches[3][$key].'</a>';
            if( strpos($urlMatches[1][$key], 'disqus.com/by') !== false ){
                $linkItem = '<a href="'.$urlMatches[1][$key].'" title="'.$urlMatches[2][$key].'" target="_blank" rel="nofollow">@'.$urlMatches[3][$key].'</a>';
            }
            if( !parse_url($urlMatches[1][$key]) ){
                $linkItem = $urlMatches[3][$key];
            }
            if( $imgKey !== false ){
                $linkItem = media_format($post -> media[$imgKey]) -> html;
            }
            $post -> message = str_replace($urlMatches[0][$key], $linkItem, $post -> message);
        }
    }

    // 是否已删除
    if(!!$post -> isDeleted){
        $post -> message = '';
        $post -> raw_message = '';
        $author -> avatar -> cache =  $avatar;
        $author -> username = '';
        $author -> name = 'Guest';
        $author -> url = '';
        $isMod = '';
    }

    return (object) array( 
        'avatar' => $author -> avatar -> cache,
        'isMod' => $isMod,
        'isDeleted' => $post -> isDeleted,
        'hasMore' => $post -> hasMore,
        'username' => $author -> username,
        'createdAt' => $post -> createdAt.'+00:00',
        'id' => $post -> id,
        'message' => $post -> message,
        'raw_message' => $post -> raw_message,
        'name' => $author -> name,
        'url' => $author -> url,
        'thread' => $post -> thread,
        'parent' => $post -> parent
    );
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

    return $protocol.$_SERVER['HTTP_HOST'].substr(str_replace('\\', '/', realpath(dirname(__FILE__))), strlen(str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT']))));
}

if( time() > strtotime($cache -> get('cookie') -> expires) || !$cache -> get('cookie') ){
    adminLogin();
}

class Forum {
    public $founder;
    public $name;
    public $url;
    public $id;
    public $pk;
    public $sort;
    public $avatar;
    public $moderatorBadgeText;
    public $settings;
    public $expires;

    public function __construct(){
    }

    protected static function convert($oForum){
        $forum = new self();
        $avatar = $oForum -> avatar -> large -> cache;
        $modText = $oForum -> moderatorBadgeText;
        $forum->moderatorBadgeText = !!$modText ? $modText : '管理员';
        $forum->founder = $oForum -> founder;
        $forum->name = $oForum -> name;
        $forum->url = $oForum -> url;
        $forum->id = $oForum -> id;
        $forum->pk = $oForum -> pk;
        $forum->sort = $oForum->sort;
        $forum->avatar = substr($avatar, 0, 2) === '//' ? 'https:'.$avatar : $avatar;
        $forum->settings = $oForum -> settings;
        return $forum;
    }

    protected static function isOld($cForum){
        if(!$cForum){
            return true;
        } else {
            if($cForum -> id == null){
              return true;
            }
        }
        $forum = new self();
        if(count(array_diff_key((array)$forum, (array)$cForum)) != 0){
            return true;
        }
        if( $cForum -> expires < time() ){
            return true;
        }
        return false;
    }

    public function update($cache){
        if(self::isOld($cache -> get('forum'))){
            $fields = (object) array(
                'forum' => DISQUS_SHORTNAME
            );
            $curl_url = '/api/3.0/forums/details.json?';
            $data = curl_get($curl_url, $fields);

            if( $data -> code == 0 ){
                $forum = self::convert($data -> response);
                $forum -> expires = time() + 3600*2;
                $cache -> update($forum,'forum');
            }
        }
    }
}

$forum = new Forum();
$forum -> update($cache);

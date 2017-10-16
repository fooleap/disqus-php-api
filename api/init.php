<?php
/**
 * 获取权限，简单封装常用函数
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-10-16 17:46:41
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('config.php');
require_once('emojione/autoload.php');

error_reporting(E_ERROR | E_PARSE);
header('Content-type:text/json');
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
$disqus_host = GFW_INSIDE == 1 ? DISQUS_IP : 'disqus.com';
$media_host = GFW_INSIDE == 1 ? DISQUS_MEDIAIP  : 'uploads.services.disqus.com';
$url = parse_url(DISQUS_WEBSITE);
$website = $url['scheme'].'://'.$url['host'];

// 读取文件
$session_data = json_decode(file_get_contents(sys_get_temp_dir().'/session-'.DISQUS_SHORTNAME.'.json'));
$session = $session_data -> session;
$pwd_md5 = $session_data -> pwd;
$date_expires = strtotime($session_data -> expires);
$date_now = strtotime(now);

// session 过期或密码更新
if( $date_now >= $date_expires || md5(DISQUS_PASSWORD) != $pwd_md5 ){
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
    );
    curl_setopt_array($ch, $options);
    $response = curl_exec($ch);
    $errno = curl_errno($ch);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $response = curl_exec($ch);
    }

    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
    $token = str_replace("Set-Cookie: csrftoken=", "", $matches[0][0]);

    // 登录并取得 session
    $params = array(
        'csrfmiddlewaretoken' => $token,
        'username' => DISQUS_EMAIL,
        'password' => DISQUS_PASSWORD 
    );
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_REFERER, 'https://disqus.com/profile/login/');
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie_temp);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    $result = curl_exec($ch);
    preg_match('/^Set-Cookie:\s+(session.*)/mi', $result, $output_match);
    preg_match('/(session[^;]*)/mi', $output_match[1], $session_match);
    preg_match('/expires=([^;]*)/mi', $output_match[1], $expires_match);
    $session = $session_match[0];
    $expires = $expires_match[1];

    curl_close($ch);
    if( strpos($session, 'session') !== false ){
        //写入文件
        $output_data = array('expires' => $expires, 'session' => $session, 'pwd' => md5(DISQUS_PASSWORD));
        file_put_contents(sys_get_temp_dir().'/session-'.DISQUS_SHORTNAME.'.json', json_encode($output_data));
    }
}

function encodeURI($uri)
{
    return preg_replace_callback("{[^0-9a-z_.!~*();,/?:@&=+$#-]}i", function ($m) {
        return sprintf('%%%02X', ord($m[0]));
    }, $uri);
}

function curl_get($url){
    global $session, $disqus_host;
    $curl_url = 'https://'.$disqus_host.$url;

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: disqus.com','Origin: https://disqus.com'),
        CURLOPT_REFERER => 'https://disqus.com',
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_RETURNTRANSFER => true
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
    $data = curl_exec($curl);
    $errno = curl_errno($curl);
    if ($errno == 60 || $errno == 77) {
        curl_setopt($curl, CURLOPT_CAINFO, dirname(__FILE__) . DIRECTORY_SEPARATOR . 'cacert.pem');
        $data = curl_exec($curl);
    }
    curl_close($curl);
    return json_decode($data);
}

function curl_post($url, $data){
    global $session, $disqus_host, $media_host;

    $curl_url = strpos($url, 'media') !== false ? 'https://'.$media_host.$url : 'https://'.$disqus_host.$url;
    $curl_host = strpos($url, 'media') !== false ? 'uploads.services.disqus.com' : 'disqus.com';

    $options = array(
        CURLOPT_URL => $curl_url,
        CURLOPT_HTTPHEADER => array('Host: '.$curl_host,'Origin: https://disqus.com'),
        CURLOPT_COOKIE => $session,
        CURLOPT_HEADER => false,
        CURLOPT_REFERER => 'https://disqus.com',
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
    );
    $curl = curl_init();
    curl_setopt_array($curl, $options);
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
    global $client;

    // 是否是管理员
    $isMod = ($post  ->  author -> username == DISQUS_USERNAME || $post -> author -> email == DISQUS_EMAIL ) && $post -> author -> isAnonymous == false ? true : false;


    // 访客指定 Gravatar 头像
    $avatar_url = GRAVATAR_CDN.md5($post -> author -> email).'?d='.GRAVATAR_DEFAULT;
    $post -> author -> avatar -> cache = $post -> author -> isAnonymous ? $avatar_url : $post -> author -> avatar -> cache;

    // 表情
    $post -> message = str_replace('<img class="emojione"','<img class="emojione" width="24" height="24"',$client -> toImage($post -> message));

    // 链接
    $post -> author -> url = !!$post -> author -> url ? $post -> author -> url : $post -> author -> profileUrl;

    // 去除链接重定向
    $urlPat = '/<a.*?href="(.*?disq\.us.*?)".*?>(.*?)<\/a>/i';
    preg_match_all($urlPat, $post -> message, $urlArr);    
    if( count($urlArr[0]) > 0 ){
        $linkArr = array();
        foreach ( $urlArr[1] as $item => $urlItem){
            parse_str(parse_url($urlItem,PHP_URL_QUERY),$out);
            $linkArr[$item] = '<a href="'.join(':', explode(':',$out['url'],-1)).'" target="_blank" title="'.$urlArr[2][$item].'">'.$urlArr[2][$item].'</a>';
        }
        $post -> message = str_replace($urlArr[0],$linkArr,$post -> message);
    }

    // 去掉图片链接
    $imgpat = '/<a(.*?)href="(.*?(disquscdn.com|media.giphy.com).*?\.(jpg|gif|png))"(.*?)>(.*?)<\/a>/i';
    $post -> message = preg_replace($imgpat,'',$post -> message);

    $imgArr = array();
    foreach ( $post -> media as $key => $image ){
        if( strpos($image -> url, 'giphy.gif') !== false ){
            $imgArr[$key] = '//a.disquscdn.com/get?url='.urlencode($image -> url).'&key=Hx_Z1IMzKElPuRPVmpnfsQ';
        } else {
            $imgArr[$key] = $image -> url;
        }
    };

    // 是否已删除
    if(!!$post -> isDeleted){
        $post -> message = '';
        $post -> author -> avatar -> cache = GRAVATAR_CDN.'?d='.GRAVATAR_DEFAULT;
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

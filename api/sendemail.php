<?php
/**
 * 发送电子邮件
 *
 * @param thread  thread 信息
 * @param parent  父评论信息
 * @param post    当前评论信息
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-09-17 13:07:28
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set("Asia/Shanghai");
require_once('init.php');
require_once('PHPMailer/class.phpmailer.php');
require_once('PHPMailer/class.smtp.php');

$authors = $cache -> get('authors');
$code = $_POST['code'];
$thread = $_POST['thread'];
$rPost = $_POST['post'];
$pPost = $_POST['parent'];
$id = $_POST['id'];

if(!empty($id)){

    if( function_exists('fastcgi_finish_request') ){
        fastcgi_finish_request();
    }

    if( function_exists('sleep') ){
        sleep(10);
    }

    $fields = (object) array(
        'post' => $id,
    );
    $curl_url = '/api/3.0/posts/details.json?';
    $data = curl_get($curl_url, $fields);
    $rPost = post_format($data->response); // 回复评论
    
    $fields = (object) array(
        'thread' => $rPost -> thread
    );
    $curl_url = '/api/3.0/threads/details.json?';
    $data = curl_get($curl_url, $fields);
    $thread = thread_format($data -> response); // 文章信息
    $pPost = null;

    if( isset($rPost -> parent) ){
        $fields = (object) array(
            'post' => $rPost -> parent,
        );
        $curl_url = '/api/3.0/posts/details.json?';
        $data = curl_get($curl_url, $fields);
        $pPost = post_format($data->response); // 被回复评论
        $pAuthor = $data->response->author;

        $pUid = md5($pAuthor->name.$pAuthor->email);
        if( $pAuthor->isAnonymous && strtotime($rPost -> createdAt) - time() < 600){
            $pEmail = $authors -> $pUid; // 被回复邮箱
            sendAnonEmail($thread, $pPost, $rPost, $pEmail);
        }
    }
    sendModEmail($thread, $pPost, $rPost);
    exit(0);
}

// 异步发邮件
if(!empty($code)){

    $thread  = json_decode($thread);
    $rPost = json_decode($rPost);
    $pPost = !empty($pPost) ? json_decode($pPost) : null;
    $pEmail = $authors -> $code;
    sendAnonEmail($thread, $pPost, $rPost, $pEmail);
    sendModEmail($thread, $pPost, $rPost);
    exit(0);
}

$debug = '';
// 匿名评论的回复通知
function sendAnonEmail($thread, $pPost, $rPost, $pEmail){
    global $cache;

    if(isset($pEmail) == false ){
        return;
    }
    $forum = $cache -> get('forum');
    $forumName = $forum -> name;
    $forumUrl = $forum -> url;

    $threadTitle = $thread -> title;
    $threadLink = $thread -> link;

    $pId = $pPost -> id;
    $pName = $pPost -> name;
    $pMessage = $pPost -> message;

    $rName = $rPost -> name;
    $rMessage = $rPost -> message;

    $title = '您在「' . $forumName . '」的留言有了新回复';
    $content = '<p>' . $pName . '，您在<a target="_blank" href="'.$forumUrl.'">「'. $forumName .'」</a>的留言：</p>';
    $content .= $pMessage;
    $content .= '<p>' . $rName . '  的回复如下：</p>';
    $content .= $rMessage;
    $content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$threadLink.'#comment-'.$pId.'">'. $threadTitle . '</a></p>';
    $fromName = defined('SMTP_FROMNAME') ? SMTP_FROMNAME : $forumName;
    sendEmail($title, $content, $pEmail, $pName, $fromName);
}

// 管理员的留言通知
function sendModEmail($thread, $pPost, $rPost) {
    global $cache;

    $forum = $cache -> get('forum');
    $forumName = $forum -> name;
    $forumUrl = $forum -> url;
    $forumPk = $forum -> pk;

    $data = curl_get('/users/self/moderation/');
    if( $data -> forum_subscriptions -> $forumPk -> subscribed || $rPost -> username == DISQUS_USERNAME || $rPost -> name == DISQUS_USERNAME){
        return;
    }

    $threadTitle = $thread -> title;
    $threadLink = $thread -> link;

    $pId = $pPost -> id;
    $pName = $pPost -> name;
    $pMessage = $pPost -> message;

    $rId = $rPost -> id;
    $rName = $rPost -> name;
    $rMessage = $rPost -> message;

    $title = '您的站点「' . $forumName . '」有了新留言';
    $content = '<p>您的站点<a target="_blank" href="'.$forumUrl.'">「'. $forumName .'」</a>有了 ' . $rName . ' 的新留言：</p>';
    $content .= $rMessage;
    if( $pPost != null ){
        $content .= '<p>该留言是对 ' . $pName . ' 以下留言进行的回复：</p>';
        $content .= $pMessage;
    }
    $content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$threadLink.'#comment-'.$rId.'">'. $threadTitle . '</a></p>';
    $fromName = defined('SMTP_FROMNAME') ? SMTP_FROMNAME : $forumName;
    sendEmail($title, $content, DISQUS_EMAIL, DISQUS_USERNAME, $fromName);
}

function sendEmail($title, $content, $email, $name, $fromName){
    $mail          = new PHPMailer();
    $mail->CharSet = "UTF-8"; 
    $mail->IsSMTP();
    $mail->SMTPAuth   = true;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->Host       = gethostbyname(SMTP_HOST);
    $mail->Port       = SMTP_PORT;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    if(!extension_loaded('openssl')){
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
    } else {
        $mail->SMTPOptions = array(
            'ssl' => array (
                'verify_peer' => true,
                'verify_depth' => 3,
                'allow_self_signed' => true,
                'peer_name' => SMTP_HOST,
                'cafile' => './cacert.pem',
            )
        );
    }
    $mail->Subject = $title;
    $mail->MsgHTML($content);
    $mail->AddAddress($email, $name);
    $from = defined('SMTP_FROM') ? SMTP_FROM : SMTP_USERNAME;
    $mail->From = $from;
    $mail->FromName = $fromName;
    //$mail->SetFrom($from, $fromName);
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = function($str, $level) {
        $GLOBALS['debug'] .= "$level: $str\n";
    };
    if(!$mail->Send()) {
        $cacheDir = defined('USE_TEMP') && USE_TEMP == 1 ? sys_get_temp_dir() . '/disqus-php-api' : dirname(__FILE__) . '/cache';
        file_put_contents($cacheDir.'/phpmailer_error.log', $GLOBALS['debug']);
    }
}

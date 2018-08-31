<?php
/**
 * 发送电子邮件
 *
 * @param thread  thread 信息
 * @param parent  父评论信息
 * @param post    当前评论信息
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-31 13:40:37
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set("Asia/Shanghai");
require_once('init.php');
require_once('PHPMailer/class.phpmailer.php');
require_once('PHPMailer/class.smtp.php');

use PHPMailer;

$code = $_POST['code'];
if(!empty($code)){
    session_start();
    if(isset($_SESSION[$code])){
        $pEmail = $_SESSION[$code];
        $thread = json_decode($_POST['thread']);
        $pPost = json_decode($_POST['parent']);
        $rPost = json_decode($_POST['post']);
        sendEmail($thread, $pPost, $rPost, $pEmail);
        session_destroy();
    }
}

$debug = '';
function sendEmail($thread, $pPost, $rPost, $pEmail){
    global $cache;

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

    $content = '<p>' . $pName . '，您在<a target="_blank" href="'.$forumUrl.'">「'. $forumName .'」</a>的评论：</p>';
    $content .= $pMessage;
    $content .= '<p>' . $rName . ' 的回复如下：</p>';
    $content .= $rMessage;
    $content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$threadLink.'?#comment-'.$pId.'">'. $threadTitle . '</a></p>';

    $mail          = new PHPMailer();
    $mail->CharSet = "UTF-8"; 
    $mail->IsSMTP();
    $mail->SMTPAuth   = true;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->Host       = SMTP_HOST;
    $mail->Port       = SMTP_PORT;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->Subject = '您在「' . $forumName . '」的评论有了新回复';
    $mail->MsgHTML($content);
    $mail->AddAddress($pEmail, $pName);
    $from = defined('SMTP_FROM') ? SMTP_FROM : SMTP_USERNAME;
    $fromName = defined('SMTP_FROMNAME') ? SMTP_FROMNAME : $forumName;
    $mail->SetFrom($from, $fromName);
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = function($str, $level) {
        $GLOBALS['debug'] .= $level.': '.$str.'\n';
    };
    if(!$mail->Send()) {
        file_put_contents(__DIR__.'/cache/phpmailer_error.log', $GLOBALS['debug']);
    }
}

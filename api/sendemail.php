<?php
/**
 * 发送电子邮件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-29 14:28:21
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set("Asia/Shanghai");
require_once('PHPMailer/class.phpmailer.php');
require_once('PHPMailer/class.smtp.php');

use PHPMailer;

$debug = '';
function sendEmail($title, $pLink, $pName, $pEmail, $pMessage, $rName, $rMessage){
    global $cache, $website;
    $forumName = $cache -> get('forum') -> name;
    $content = '<p>' . $pName . '，您在<a target="_blank" href="'.$website.'">「'. $forumName .'」</a>的评论：</p>';
    $content .= $pMessage;
    $content .= '<p>' . $rName . ' 的回复如下：</p>';
    $content .= $rMessage;
    $content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$pLink. '">'. $title . '</a></p>';
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
        $GLOBALS['debug'] .= '$level: $str\n';
    };
    if(!$mail->Send()) {
        file_put_contents(__DIR__.'/cache/phpmailer_error.log', $GLOBALS['debug']);
    }
}

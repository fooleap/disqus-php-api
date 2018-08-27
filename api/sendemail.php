<?php
/**
 * 发送电子邮件
 *
 * @param parent       父评论 ID
 * @param id           评论 ID
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-08-28 13:48:44
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set("Asia/Shanghai");
require_once('init.php');

$authors = $cache -> get('authors');
$forumName = $cache -> get('forum') -> name;
$pId = $_POST['parent'];
$id = $_POST['id'];

// 获取被回复人信息
$curl_url = '/api/3.0/posts/details.json?';
$fields = (object) array(
    'post' => $pId,
    'related' => 'thread'
);
$data = curl_get($curl_url, $fields);

$title = $data->response->thread->clean_title;
$pAuthor = $data->response->author;
$pLink = $data->response->url; // 被回复链接

$pUid = md5($pAuthor->name.$pAuthor->email);
$pEmail = $authors -> $pUid; // 被回复邮箱

$post = post_format($data->response);
$pName    = $post['name']; // 被回复人名
$pMessage = $post['message']; // 被回复留言

// 不存在邮箱
if(isset($pEmail) == false){
    exit(0);
}

// 获取回复信息
$fields = (object) array(
    'post' => $id
);
$data = curl_get($curl_url, $fields);
$post = post_format($data->response);
$rName    = $post['name']; // 回复者人名
$rMessage = $post['message']; // 回复者留言

$content = '<p>' . $pName . '，您在<a target="_blank" href="'.$website.'">「'. $forumName .'」</a>的评论：</p>';
$content .= $pMessage;
$content .= '<p>' . $rName . ' 的回复如下：</p>';
$content .= $rMessage;
$content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$pLink. '">'. $title . '</a></p>';

sleep(5);

use PHPMailer;

// 发送邮件
require_once('PHPMailer/class.phpmailer.php');
require_once('PHPMailer/class.smtp.php');
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

$debug = '';
$mail->SMTPDebug = 2;
$mail->Debugoutput = function($str, $level) {
    $GLOBALS['debug'] .= '$level: $str\n';
};
if(!$mail->Send()) {
    file_put_contents('./cache/phpmailer_error.log', $debug);
} else {
    echo "恭喜，邮件发送成功！";
}

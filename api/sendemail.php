<?php
    namespace Emojione;
    date_default_timezone_set("Asia/Shanghai");
    require_once('init.php');

    // 获取被回复人信息
    $fields_data = array(
        'api_key' => $public_key,
        'post' => $_POST['parent']
    );
    $curl_url = 'https://disqus.com/api/3.0/posts/details.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);
    $post = post_format($data->response);
    $parent_email   = $data->response->author->email; //被回复邮箱
    $parent_name    = $post['name']; //被回复人名
    $parent_message = $post['message']; //被回复留言

    // 获取回复信息
    $fields_data = array(
        'api_key' => $public_key,
        'post' => $_POST['id']
    );
    $curl_url = 'https://disqus.com/api/3.0/posts/details.json?'.http_build_query($fields_data);
    $data = curl_get($curl_url);
    $post = post_format($data->response);
    $reply_name    = $post['name']; //回复者人名
    $reply_message = $post['message']; //回复者留言

    $content = '<p>' . $parent_name . '，您在<a href="'.$origin.'" target="_blank">「'.$site_name.'」</a>的评论：</p>';
    $content .= $parent_message;
    $content .= '<p>' . $reply_name . ' 的回复如下：</p>';
    $content .= $reply_message;
    $content .= '<p>查看详情及回复请点击：<a target="_blank" href="'.$origin. $_POST['link'] . '#comment-' . $_POST['parent'] . '">' . $_POST['title'] . '</a></p>';
    
    // 发送邮件
    use PHPMailer;
    require_once('class.phpmailer.php');
    require_once('class.smtp.php');
    $mail          = new PHPMailer();
    $mail->CharSet = "UTF-8"; 
    $mail->IsSMTP();
    $mail->SMTPAuth   = true;
    $mail->SMTPSecure = "ssl";
    $mail->Host       = $smtp_host;
    $mail->Port       = $smtp_port;
    $mail->Username   = $smtp_username;
    $mail->Password   = $smtp_password;
    $mail->SetFrom($smtp_username, $site_name); 
    $mail->Subject = '您在「'.$site_name.'」的评论有了新回复';
    $mail->MsgHTML($content);
    $mail->AddAddress($parent_email, $parent_name);
    if(!$mail->Send()) {
        echo "发送失败：" . $mail->ErrorInfo;
    } else {
        echo "恭喜，邮件发送成功！";
    }

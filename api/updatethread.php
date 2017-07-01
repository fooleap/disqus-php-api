<?php
/**
 * 更新 Thread
 *
 * @param thread          Thread ID
 * @param url             页面完整链接
 * @param title           标题
 * @param author          author
 * @param sulg            slug
 * @param message         message
 * @param old_identifier  old_identifier
 * @param identifier      identifier
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-07-01 16:13:50
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');
$curl_url = '/api/3.0/threads/update.json';
$post_data = array(
    'api_key' => DISQUS_PUBKEY,
    'forum' => DISQUS_SHORTNAME,
    'author' => $_POST['author'],
    'identifier' => $_POST['identifier'],
    'message' => $_POST['message'],
    'old_identifier' => $_POST['old_identifier'],
    'slug' => $_POST['slug'],
    'thread' => $_POST['thread'],
    'title' => $_POST['title'],
    'url' => $_POST['url']
);
$data = curl_post($curl_url, $post_data);
print_r(json_encode($data)); 

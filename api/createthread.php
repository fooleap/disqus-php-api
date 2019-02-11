<?php
/**
 * 创建 Thread
 *
 * @param url         页面完整链接
 * @param title       标题
 * @param sulg        slug
 * @param message     message
 * @param identifier  identifier
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:34:03
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$curl_url = '/api/3.0/threads/create.json';
$post_data = (object) array(
    'forum' => DISQUS_SHORTNAME,
    'identifier' => $_POST['identifier'],
    'message' => $_POST['message'],
    'slug' => $_POST['slug'],
    'title' => $_POST['title'],
    'url' => $_POST['url']
);
$data = curl_post($curl_url, $post_data);
print_r(jsonEncode($data)); 

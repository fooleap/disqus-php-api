<?php
/**
 * 获取媒体文件详情
 *
 * @param url   支持的链接
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-09-19 00:07:44
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$url = $_POST['url'];
$fields = (object) array(
    'url' => $url
);

$curl_url = '/api/3.0/media/details.json?';
$data = curl_post($curl_url, $fields);

$output = (object) array(
    'code' => $data -> code,
    'response' => media_format($data -> response)
);

print_r(json_encode($output));

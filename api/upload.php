<?php
/**
 * 上传图片
 *
 * @param file  上传的文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-06-27 09:07:07
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');
$curl_url = '/api/3.0/media/create.json';
$cfile = curl_file_create($_FILES['file']['tmp_name'],$_FILES['file']['type'],$_FILES['file']['name']);
$filename = $_FILES['file']['name'];
$filedata = $_FILES['file']['tmp_name'];
$filesize = $_FILES['file']['size'];
$post_data = array(
    'api_key' => DISQUS_PUBKEY,
    'permanent' => 1,
    'upload' => $cfile
);
$data = curl_post($curl_url, $post_data);
print_r(json_encode($data));

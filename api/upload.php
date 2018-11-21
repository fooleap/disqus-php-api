<?php
/**
 * 上传图片
 *
 * @param file  上传的文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:38:12
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');

if ($_FILES['file']['error']){
    $data = array(
        'code' => 2,
        'response' => '上传出错'
    );
    print_r(jsonEncode($data));
    return;
}

$curl_url = '/api/3.0/media/create.json';
$cfile = curl_file_create($_FILES['file']['tmp_name'],$_FILES['file']['type'],$_FILES['file']['name']);

$post_data = (object) array(
    'permanent' => 1,
    'upload' => $cfile
);
$data = curl_post($curl_url, $post_data);
print_r(jsonEncode($data));

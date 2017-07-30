<?php
/**
 * 上传图片
 *
 * @param file  上传的文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-07-30 14:08:51
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');

if ($_FILES['file']['error']){
    $data = array(
        'code' => 2,
        'response' => '上传出错'
    );
    print_r(json_encode($data));
    return;
}

$curl_url = '/api/3.0/media/create.json';
$cfile = curl_file_create($_FILES['file']['tmp_name'],$_FILES['file']['type'],$_FILES['file']['name']);

$post_data = array(
    'api_key' => DISQUS_PUBKEY,
    'permanent' => 1,
    'upload' => $cfile
);
$data = curl_post($curl_url, $post_data);
print_r(json_encode($data));

<?php
/**
 * 上传文件或获取媒体文件详情
 *
 * @param url   支持的链接
 * @param file  上传的文件
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-04-19 13:14:56
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
if(isset($_POST['url']) == false){
    if ($_FILES['file']['error']){
        $data = array(
            'code' => 2,
            'response' => '上传出错'
        );
        print_r(jsonEncode($data));
        return;
    }

    $curl_url = '/api/3.0/media/create.json';
    $filename = $_FILES['file']['name'];
    $cfile = curl_file_create($_FILES['file']['tmp_name'],$_FILES['file']['type'],$filename);

    $post_data = (object) array(
        'permanent' => 1,
        'upload' => $cfile
    );
    $data = curl_post($curl_url, $post_data);
    if( $data -> code == 0 ){
        $url = $data -> response -> {$filename} -> url;
    } else {
        print_r(jsonEncode($data));
        exit(0);
    }
} else {
    $url = $_POST['url'];
}

$fields = (object) array(
    'url' => $url,
    'forum' => DISQUS_SHORTNAME
);

$curl_url = '/api/3.0/media/details.json?';
$data = curl_post($curl_url, $fields);

$output = (object) array(
    'code' => $data -> code,
    'response' => media_format($data -> response)
);

print_r(jsonEncode($output));

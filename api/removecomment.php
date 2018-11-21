<?php
/**
 * 删除评论
 *
 * @param id  评论 ID
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:36:55
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
date_default_timezone_set('UTC');
require_once('init.php');

$fields = (object) array(
    'post' => $_POST['id']
);
$curl_url = '/api/3.0/posts/details.json?';
$data = curl_get($curl_url, $fields);
$duration = time() - strtotime($data->response->createdAt);

$output = array();

if($data->code !== 0){
    $output = array( 
        'code' => 2,
        'response' => '请求方式有误或不存在此 post'
    );
    print_r(jsonEncode($output));
    return;
}

if( $data->response->isDeleted ){
    // 已删除
    $output = array( 
        'code' => 0,
        'response' => array(
            'isDeleted' => true,
            'message' => '该留言已删除'
        )
    );
} else {
    if( $duration < 600 ){
        // 十分钟内
        $post_data = (object) array(
            'post' => $_POST['id']
        );
        $curl_url = '/api/3.0/posts/remove.json';
        curl_post($curl_url, $post_data);
        $output = array( 
            'code' => 0,
            'response' => array(
                'isDeleted' => true,
                'message' => '删除成功'
            )
        );
    } else {
        // 十分钟外
        $output = array( 
            'code' => 0,
            'response' => array(
                'isDeleted' => false,
                'message' => '删除失败，留言时间已超过十分钟'
            )
        );
    }
}

print_r(jsonEncode($output));

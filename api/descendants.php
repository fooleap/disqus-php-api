<?php
/**
 * 获取后代回复
 *
 * @param limit 数量
 * @param order 排序
 * @param post  post id
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2019-04-19 09:34:53
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$fields = (object) array(
    'limit' => isset($_GET['limit']) ? $_GET['limit'] : 100,
    'order' => isset($_GET['order']) ? $_GET['order'] : 'desc',
    'post' => $_GET['post']
);
$curl_url = '/api/3.0/posts/getDescendants?';
$data = curl_get($curl_url, $fields);

$posts = array();
if (is_array($data -> response) || is_object($data -> response)){
    foreach ( $data -> response as $key => $post ) {
        $posts[$key] = post_format($post);
    }
}

$output = $data -> code == 0 ? (object) array(
    'code' => 0,
    'response' => $posts,
) : $data;

print_r(jsonEncode($output));

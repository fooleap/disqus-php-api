<?php
/**
 * 获取 Gravatar 头像
 *
 * @param name  昵称
 * @param email 邮箱号
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:34:39
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$email = $_GET['email'];
$avatar = $cache -> get('forum') -> avatar;
if( defined('GRAVATAR_DEFAULT') ){
    $avatar_default = GRAVATAR_DEFAULT;
} else {
    $avatar_default = strpos($avatar, 'https') !== false ? $avatar : 'https:'.$avatar;
}
$gravatar =  GRAVATAR_CDN.md5($email).'?d='.$avatar_default.'&s=92';

$mailpart = explode('@',$email);
$isEmail = checkdnsrr(array_pop($mailpart),'MX') ? true : false;

$output = array(
    'isEmail' => $isEmail,
    'gravatar' => $gravatar
);
print_r(jsonEncode($output));

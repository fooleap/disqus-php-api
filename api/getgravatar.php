<?php
/**
 * 获取 Gravatar 头像
 *
 * @param email 邮箱号
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-03-27 22:44:44
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$mailpart = explode("@",$_GET['email']);
$avatar_default = strpos($forum_data -> forum -> avatar, 'https') !== false ? $forum_data -> forum -> avatar : 'https:'.$forum_data -> forum -> avatar;
$output = checkdnsrr(array_pop($mailpart),"MX") ? GRAVATAR_CDN.md5($_GET['email']).'?d='.$avatar_default : 'false';
print_r($output);

<?php
/**
 * 获取 Gravatar 头像
 *
 * @param email 邮箱号
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2017-10-12 23:01:30
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
$mailpart = explode("@",$_GET['email']);
$output = checkdnsrr(array_pop($mailpart),"MX") ? GRAVATAR_CDN.md5($_GET['email']).'?d='.GRAVATAR_DEFAULT : 'false';
print_r($output);

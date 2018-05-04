<?php
/**
 * 退出
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-05-04 23:26:14
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');
header('Content-type:text/json');
setcookie('access_token', '', time () - 100, substr(__DIR__, strlen($_SERVER['DOCUMENT_ROOT'])), $_SERVER['HTTP_HOST'], false, true); 

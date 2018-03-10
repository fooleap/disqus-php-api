<?php
/**
 * 退出
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-03-10 14:02:20
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
namespace Emojione;
require_once('init.php');
header('Content-type:text/json');
setcookie( 'user_id', '', time () - 100 );

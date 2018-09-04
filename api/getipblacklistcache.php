<?php
require_once('init.php');
$temp = json_encode($ipblacklistcache->get());
echo ($temp);
?>
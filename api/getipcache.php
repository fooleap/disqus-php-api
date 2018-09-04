<?php
require_once('init.php');
$temp = json_encode($ipcache->get());
echo ($temp);
?>
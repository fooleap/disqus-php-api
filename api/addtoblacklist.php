<?php
	require_once('init.php');
	$id = $_POST['id'];
	$posts = $ipcache -> get();
	$ip = $posts->$id;
	$time = date('Y-m-d h:i:s', time());
	$ipbl = $ipblacklistcache->get();
	$ipbl -> $id = (object)array('ip'=>$ip,'time'=>$time);
	$ipblacklistcache->update($ipbl);

?>
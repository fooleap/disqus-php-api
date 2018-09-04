<?php
	require_once('init.php');
	$ip = $_POST['ip'];
	$ipbl = $ipblacklistcache->get();
	foreach ($ipbl as $key => $value) {
		if (($value -> ip) == $ip) {
			unset($ipbl->$key);
			break;
		}
	}
	$ipblacklistcache->update($ipbl);

?>
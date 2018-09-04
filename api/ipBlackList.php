<?php
	require_once('init.php');
	$result = 0;
	$ip = $_POST['ip'];
	$ipbl = $ipblacklistcache->get();
	foreach($ipbl as $key=>$value){
		$time = date('Y-m-d h:i:s', time());
		if(($time - $value->time)/3600 > 24){
			unset($ipbl->$key);
			$ipblacklistcache->update($ipbl);
		}
		if($value->ip == $ip){
			$result = 1;
			break;
		}
	}
	echo $result;

?>
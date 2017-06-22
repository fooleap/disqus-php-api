<?php
    require_once('init.php');
    $output = checkdnsrr(array_pop(explode("@",$_GET['email'])),"MX") ? GRAVATAR_CDN.md5($_GET['email']).'?d='.GRAVATAR_DEFAULT : 'false';
    print_r($output);

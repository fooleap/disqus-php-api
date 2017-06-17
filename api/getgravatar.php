<?php
    require_once('init.php');
    $avatar_url = $gravatar_cdn.md5($_GET['email']).'?d='.$gravatar_def;
    $output = checkdnsrr(array_pop(explode("@",$_GET['email'])),"MX") ? $avatar_url : 'false';
    print_r($output);

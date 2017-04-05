<?php
    header('Content-type:text/json');
    header('Access-Control-Allow-Origin: *');
    $avatar_url = '//cdn.v2ex.com/gravatar/'.md5($_GET['email']).'?d=https://a.disquscdn.com/images/noavatar92.png';
    $output = checkdnsrr(array_pop(explode("@",$_GET['email'])),"MX") ? $avatar_url : 'false';
    print_r($output);

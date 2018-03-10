<?php
namespace Emojione;
require_once('init.php');

if ( isset($user_id) ){
    print_r(getUserData());
} else {

    // 未登录
    $output = array(
        'code' => 4,
        'response' => '未登录'
    );

    print_r(json_encode($output));
}

<?php
/**
 * 登录
 *
 * @author   fooleap <fooleap@gmail.com>
 * @version  2018-11-07 23:35:40
 * @link     https://github.com/fooleap/disqus-php-api
 *
 */
require_once('init.php');
header('Content-type:text/html');

$redirect = getCurrentDir().'/login.php';
$CODE = $_GET['code'];

if( isset($access_token) ){
    print_r('已登录');
    echo '<script>parent.close();</script>';
}

if( isset($CODE)){

    $authorize = 'authorization_code';
    $fields = (object) array(
        'grant_type' => $authorize,
        'client_id' => PUBLIC_KEY,
        'client_secret' => SECRET_KEY,
        'redirect_uri' => $redirect,
        'code' => $CODE
    );
    $access_token = getAccessToken($fields);
    if( $access_token ){
?>
<!doctype html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>登录成功</title>
        <style>
            .success-bg{
                display: block;
                transform: rotate(-135deg);
                margin: 0 auto;
            }
            .success-container{
                margin: 20px auto 40px;
                color: rgb(157,158,161);
                text-align: center;
                display: block;
                position: relative;
                height: 100px;
                line-height: 40px;
                width: 250px;
            }
            .success-container:after{
                display: block;
                position: absolute;
                content: "";
                box-sizing: border-box;
                width: 26px;
                height: 26px;
                top: 20px;
                left: 115px;
                border-width: 3px;
                border-style: solid;
                border-color: rgb(157,158,161) transparent;
                border-radius: 13px;
                transform-origin: 50% 50% 0;
                animation:disqus-loader-spinner-animation .7s infinite linear;
            }
            @keyframes disqus-loader-spinner-animation{
               0%{transform:rotate(0)}
               100%{transform:rotate(360deg)}
            }
        </style>
    </head>
    <body>
        <div class="success-container">
            <svg class="success-bg" width="72" height="72" viewBox="0 0 720 720" version="1.1" xmlns="http://www.w3.org/2000/svg"><path class="ring" fill="none" stroke="#9d9ea1" d="M 0 -260 A 260 260 0 1 1 -80 -260" transform="translate(400,400)" stroke-width="50" /><polygon transform="translate(305,20)" points="50,0 0,100 18,145 50,82 92,145 100,100" style="fill:#9d9ea1"/></svg>
        </div>
        <script>
            parent.close();
        </script>
    </body>
</html>
<?php }
} else { 
    $client_id = PUBLIC_KEY;
    $scope = 'read,write';
    $response_type = 'code';
    $auth_url = 'https://disqus.com/api/oauth/2.0/authorize?client_id='.$client_id.'&scope='.$scope.'&response_type='.$response_type.'&redirect_uri='.$redirect;
    header("Location: ".$auth_url);   
} ?>

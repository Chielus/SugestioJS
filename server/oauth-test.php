<?php
    $method = $_SERVER['REQUEST_METHOD'];
    $uri = 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
    $sig = $_GET['oauth_signature'];
    $req = new OAuthRequest($method, $uri);
    
    //token is null because we're doing 2-leg
    $valid = $sig_method->check_signature( $req, $consumer, null, $sig );
    
    if(!$valid){
        die('invalid sig');
    }
    echo 'orale!';
?>
<?php
//SIGNER page. Wordt aangesproken met AJAX om de X-Sugestio-oauth-hash aan te maken
//X-Sugestio-oauth-hash = sha1(consumer_key="xxx"&consumer_secret="xxx-secret"&ip="w.x.y.z"&userid="id")
include_once dirname(__FILE__) . '/oauth-php/library/OAuthRequester.php';
include_once dirname(__FILE__) . '/oauth-php/library/OAuthStore.php';

header("Content-Type: text/xml");
setCookie("userid","tester"); //bij login

define("CONSUMER_KEY", "magento"); //FILL THIS
define("CONSUMER_SECRET", "pEG2aihBdV"); //FILL THIS


//  Init the OAuthStore
$options = array(
    'consumer_key' => CONSUMER_KEY, 
    'consumer_secret' => CONSUMER_SECRET
);
OAuthStore::instance("2Leg", $options);

$ip = $_SERVER['REMOTE_ADDR'];
$userid = $_COOKIE['userid'];

$request = $_POST['request'];
$method = $_POST['method'];
$params = json_decode($_POST['params'],true);
if(is_null($params)){
    $params = array();
}
$params = removeEmptiesFromArray($params);
function removeEmptiesFromArray($array=array()) {

    foreach ($array as $key => $value) {
        if (is_null($value) || $value == "") {
            unset($array[$key]);
        }
    }
    return $array;
}
$req = new OAuthRequester($request, $method, $params);
$req->sign(0,null,'');
$header = $req->getAuthorizationHeader();

$str = "consumer_key=".$consumer_key."&consumer_secret=".$consumer_secret."&ip=".$ip."&userid=".$userid;

$doc = new DOMDocument();
$doc->formatOutput = true;

$r = $doc->createElement("auth-info");
$doc->appendChild( $r );
$hash = $doc->createElement("X-Sugestio-oauth-hash");
$hash->appendChild(
  $doc->createTextNode( sha1($str) )
);
$r->appendChild($hash);
$auth = $doc->createElement("Authorization");
$auth->appendChild(
  $doc->createTextNode($header)
  //$doc->createTextNode("test")
);
$r->appendChild($auth);
echo $doc->saveXML();

?>
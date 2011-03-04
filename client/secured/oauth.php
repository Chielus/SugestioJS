<?php

include_once "oauth-php/library/OAuthStore.php";
include_once "oauth-php/library/OAuthRequester.php";

define("CONSUMER_KEY", "FILL THIS"); // 
define("CONSUMER_SECRET", "FILL THIS"); // 

define("OAUTH_HOST", "https://www.google.com");
define("REQUEST_TOKEN_URL", OAUTH_HOST . "/accounts/OAuthGetRequestToken");
define("AUTHORIZE_URL", OAUTH_HOST . "/accounts/OAuthAuthorizeToken");
define("ACCESS_TOKEN_URL", OAUTH_HOST . "/accounts/OAuthGetAccessToken");

define('OAUTH_TMP_DIR', function_exists('sys_get_temp_dir') ? sys_get_temp_dir() : realpath($_ENV["TMP"]));

//  Init the OAuthStore
$options = array(
	'consumer_key' => GOOGLE_CONSUMER_KEY, 
	'consumer_secret' => GOOGLE_CONSUMER_SECRET,
	'server_uri' => GOOGLE_OAUTH_HOST,
	'request_token_uri' => GOOGLE_REQUEST_TOKEN_URL,
	'authorize_uri' => GOOGLE_AUTHORIZE_URL,
	'access_token_uri' => GOOGLE_ACCESS_TOKEN_URL
);
// Note: do not use "Session" storage in production. Prefer a database
// storage, such as MySQL.
OAuthStore::instance("Session", $options);

try
{
	//  STEP 1:  If we do not have an OAuth token yet, go get one
	if (empty($_GET["oauth_token"]))
	{
		$getAuthTokenParams = array('scope' => 
			'http://docs.google.com/feeds/',
			'xoauth_displayname' => 'Oauth test',
			'oauth_callback' => 'http://sugestio.client/googlecallback.php');

		// get a request token
		$tokenResultParams = OAuthRequester::requestRequestToken(GOOGLE_CONSUMER_KEY, 0, $getAuthTokenParams);

		//  redirect to the google authorization page, they will redirect back
		header("Location: " . GOOGLE_AUTHORIZE_URL . "?btmpl=mobile&oauth_token=" . $tokenResultParams['token']);
	}
	else {
		//  STEP 2:  Get an access token
		$oauthToken = $_GET["oauth_token"];
		
		// echo "oauth_verifier = '" . $oauthVerifier . "'<br/>";
		$tokenResultParams = $_GET;
		
		try {
		    OAuthRequester::requestAccessToken(GOOGLE_CONSUMER_KEY, $oauthToken, 0, 'POST', $_GET);
		}
		catch (OAuthException2 $e)
		{
			var_dump($e);
		    // Something wrong with the oauth_token.
		    // Could be:
		    // 1. Was already ok
		    // 2. We were not authorized
		    return;
		}
		
		// make the docs requestrequest.
		$request = new OAuthRequester("http://docs.google.com/feeds/documents/private/full", 'GET', $tokenResultParams);
		$result = $request->doRequest(0);
		if ($result['code'] == 200) {
			var_dump($result['body']);
		}
		else {
			echo 'Error';
		}
	}
}
catch(OAuthException2 $e) {
	echo "OAuthException:  " . $e->getMessage();
	var_dump($e);
}
?>
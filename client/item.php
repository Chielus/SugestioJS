<?php
    setcookie("userid",3);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Client website</title>
<link rel="stylesheet" type="text/css" href="sugestiojs/sugestio.css" />
<style type="text/css">
label{
	float: left;	
}
</style>
<script type="text/javascript" src="sugestiojs/sugestio.js"></script>
<script type="text/javascript" src="http://ajax.cdnjs.com/ajax/libs/sizzle/1.4.4/sizzle.min.js"></script>
<script type="text/javascript">
    function getCookie(c_name) {
        var i,x,y,ARRcookies=document.cookie.split(";");
        for (i=0;i<ARRcookies.length;i++) {
            x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
            y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
            x=x.replace(/^\s+|\s+$/g,"");
            if (x==c_name) {
                return unescape(y);
            }
        }
    }
    function getUser(){
        return getCookie('userid');
    }
    sugestio.user.login(getUser,this);
</script>
</head>
<body>
<h1>Client website on sugestio.client</h1>
<h2>Item <?php echo $_GET['id']; ?></h2>
<div id='similar'><p><strong>Similar items:</strong></p></div>
<script type="text/javascript">
	//resp is a JSON array. Elements is not obligatory
	var container = document.getElementById('similar');
	function parseSimilar(resp){
		for(var j=0;j<resp.length;j++){
			console.log(resp[j]);
			var p = document.createElement('p');
			p.innerHTML = resp[j].itemid;
			container.appendChild(p);
		}
	}
	sugestio.item.similar(<?php echphpphpo $_GET['id']; ?>,parseSimilar,this);
</script>
<script type="text/javascript">
	sugestio.consumptions({
		type: 'VIEW',
		itemid: <?php echo $_GET['id']; ?> //GET variabele kan eventueel ook met JavaScript opgehaald worden, POST uiteraard niet
	});
</script>

<form id="form1" method="post" onsubmit="return false;"><div class="rating-form"><label>Rating2 in form: </label>
<script type="text/javascript">
	sugestio.ratingWidget({type: 'star', itemid: <?php echo $_GET['id']; ?>, contentEl: 'div.rating-form', formEl: '#form1', min: 1, max: 5});
</script>
<input type="submit" value="Rate!" />
</div>
</form>

</body>
</html>

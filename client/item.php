<?php
    setcookie("userid",3);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Client website</title>
<link rel="stylesheet" type="text/css" href="SugestioJS/sugestio.css" />
<style type="text/css">
label{
	float: left;	
}
p.recommendation{
    margin: 0px;
}
</style>
<script type="text/javascript" src="sizzle.js"></script>
<script type="text/javascript" src="SugestioJS/sugestio.js"></script>
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
    var loggedIn = sugestio.user(getUser,this);
    var item = sugestio.item(<?php echo $_GET['id']; ?>); //GET variabele kan eventueel ook met JavaScript opgehaald worden, POST uiteraard niet
    //console.log(item.id);
</script>
</head>
<body>
<h1>Client website on sugestio.client</h1>
<h2>Item <?php echo $_GET['id']; ?></h2>
<div id='similar'><p><strong>Similar items:</strong></p></div>
<script type="text/javascript">
	//resp is a JSON array. Elements is not obligatory
	
	function parseSimilar(resp){
	    var container = document.getElementById('similar');
		for(var j=0;j<resp.length;j++){
			var p = document.createElement('p');
			p.className = "recommendation";
			p.innerHTML = resp[j].itemid;
			container.appendChild(p);
		}
	}
	item.similar(parseSimilar,this);
</script>
<script type="text/javascript">
	/*loggedIn.view({
		itemid: item.id 
	});*/
</script>
<label>Rating1</label>
<div class="rating">
</div><br />
<div class="rating2">
</div><br />
<form id="form1" method="post" onsubmit="return false;"><div class="rating-form"><label>Rating2 in form: </label>
<script type="text/javascript">
    sugestio.ratingWidget({type: 'star', itemid: item.id, userid: loggedIn.id, contentEl: Sizzle('div.rating'), min: 0, max: 9});
    //sugestio.ratingWidget({type: 'star', itemid: item.id, contentEl: Sizzle('div.rating2'), min: 2, max: 7, userid: 'tester'});
	sugestio.ratingWidget({type: 'star', itemid: item.id, userid: 'tester', contentEl: Sizzle('div.rating-form'), formEl: Sizzle('#form1'), min: 1, max: 5});
    /*var el = document.getElementById('form1');
    console.log(el.nodeName);*/
</script>
<input type="submit" value="Rate!" />
</div>
</form>

</body>
</html>

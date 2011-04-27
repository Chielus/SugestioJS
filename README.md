# Overview

This is a JavaScript library for interfacing with the [Sugestio](http://www.sugestio.com) 
recommendation service. Sugestio also has [server-side libraries](http://www.sugestio.com/libraries).

## About Sugestio

Sugestio is a scalable and fault tolerant service that now brings the power of 
web personalisation to all developers. The RESTful web service provides an easy to use 
interface and a set of developer libraries that enable you to enrich 
your content portals, e-commerce sites and other content based websites.

### Access credentials and the Sandbox

To access the Sugestio service, you need an account name and a secret key. 
To run the examples from the tutorial, you can use the following credentials:

* account name: <code>sandbox</code>
* secret key: <code>demo</code>

The Sandbox is a *read-only* account. You can use these credentials to experiment 
with the service. The Sandbox can give personal recommendations for users 1 through 5, 
and similar items for items 1 through 5.

When you are ready to work with real data, you may apply for a developer account through 
the [Sugestio website](http://www.sugestio.com).

## About this library

### Features

The following [API](http://www.sugestio.com/documentation) features are implemented:

* get personalized recommendations for a given user
* get items that are similar to a given item
* get users that are similar to a given user
* submit user activity (consumptions): clicks, purchases, ratings, ...
* submit item metadata: description, location, tags, categories, ...  	
* submit user metadata: gender, location, birthday, ...
* TODO: delete consumptions
* delete item metadata
* delete user metadata

### Requirements

TODO: uitleg rond OAuth

# Quick start

First include the SugestioJS script. Then you have to pass some options by calling the global function sugestioInit

	<script type="text/javascript" src="SugestioJS/sugestio.js"></script>
	<script type="text/javascript">
	    var options = {
		secured: false,
		account: 'sandbox',
		baseURL: 'http://js.sugestio.com'
	    }
	    sugestioInit(options);
	</script>

Now you can use the global variable sugestio to submit resources or get recommendations

	<script type="text/javascript">
	    // submit user metadata for user with ID 1
	    sugestio.user(1).meta({gender: 'M', birthday: '1967-02-17'});

	    // submit item metadata for item with ID 2
	    var item = sugestio.item(2);
	    item.meta({title: 'Item 2', category: ['A', 'B']});

	    // delete previous item metadata
	    item.del();

	    // user 1 has viewed item 2
	    sugestio.user(1).view(2);
	</script>

	<div id='recommendations'><p><strong>Recommendations:</strong></p></div>
	<script type="text/javascript">
	    //resp is an array of object literals. Elements is not obligatory
	    function parseRecommendations(resp){
		var container = document.getElementById('recommendations');
		for(var j=0;j<resp.length;j++){
		    var p = document.createElement('p');
		    p.className = "recommendation";
		    p.innerHTML = resp[j].itemid;
		    container.appendChild(p);
		}
	    }
	    var loggedIn = sugestio.user(1);
	    loggedIn.recommendations(parseRecommendations,this);
	</script>

	<div id='similar'><p><strong>Similar users:</strong></p></div>
	<script type="text/javascript">
	    function parseSimilar(resp){
	        var container = document.getElementById('similar');
		//iterate over the response array
	        for(var j=0;j<resp.length;j++){
	            var p = document.createElement('p');
	            p.className = "recommendation";
	            p.innerHTML = resp[j].userid;
	            container.appendChild(p);
	        }
            }
	    loggedIn.similar(parseSimilar,this);
	</script>

For submitting data or consumptions to Sugestio you can also listen to events of the DOM.
Just pass the DOM element(s) as the second parameter

	<button type="button" id="view1" class="view">View item 1</button>
	<script type="text/javascript">
	    sugestio.user(3).view({
	        itemid: 1
	    },document.getElementById("view1"));
	</script>

In case you want to bind a Sugestio call to a form, you have to command SugestioJS to get the values from the corresponding DOM elements:

	<form id="formUser" method="post" onsubmit="return false;">
	    <div class="rating-form">
	        <label>Username: </label><input type="text" name="username" value="" /><br />
	        <label>Gender: </label><input type="radio" name="gender" value="M" /><input type="radio" name="gender" value="F" />
	        <script type="text/javascript">
	            sugestio.user.meta({idEl: document.getElementsByName('username'), genderEl: document.getElementsByName('gender')},document.getElementById('formUser'));
	        </script>
	        <input type="submit" value="Subscribe" />
	        <br />
	    </div>
	</form>

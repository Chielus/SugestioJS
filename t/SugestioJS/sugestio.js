//first load the easyXDM en sizzle scripts, then SugestioJS
function scriptsLoaded() {
    //Anonymous function to protect global vars
    (function () {
        var remoteURL = (document.domain==='sugestio.client' ? "http://api.sugestio.com/michiel" : "http://js.sugestio.com/michiel"),
            string = "string",
            nmb = "number",
            i = 0,
            consumptions = "view rating wishlist basket purchase collection checkin".split(" "),
            S = { //sugestio object
                //sugestio.user: returns the User class
                //static functions of the User class are functions binded to this function
                //regular functions are functions bind to the User class
                user: function(a,b){ 
                    var id = null;
                    //(func,scope) OR
                    //(userid)
                    if (S.is(a,"function")) {
                        if (S.is(b,"object")) {
                            id = a.apply(b, []);
                        } else {
                            id = a.apply(this, []);
                        }
                    } else {
                        id = a;
                    }
                    return new User(id);
                },
                //sugestio.item: returns the User class
                //static functions of the User class are functions binded to this function
                //regular functions are functions bind to the Item class
                item: function(a,b){
                    var id = null;
                    //(func,scope) OR
                    //(itemid)
                    if (S.is(a,"function")) {
                        if (S.is(b,"object")) {
                            id = a.apply(b, []);
                        } else {
                            id = a.apply(this, []);
                        }
                    } else {
                        id = a;
                    }
                    return new Item(id);
                }
            },
            //easyXDM socket for communicating between 2 iframes
            socket = new easyXDM.Socket({
                local: "index.html",
                remote: remoteURL + "/index.html",
                onReady: function () {
                    //if we want to do something when the socket is ready
                },
                onMessage: function (message, origin) {
                    //console.log(message);
                    var response = JSON.parse(message),
                        id = response.id;
                    if (response.result) {
                        remoteCallbacks[id].success(response.result);
                    } else {
                        remoteCallbacks[id].error(response.message);    
                    }
                }
            });
        //if JSON2 is not supported natively by the browser, this API will do the (de)serialization
        easyXDM.DomHelper.requiresJSON("SugestioJS/easyXDM/json2.js");
        //gets the values for the Sugestio request
        //if the key ends with "El", we have to get the value of that DOM Element
        function getSubmitData(data) {
            var result = {},
                i = 0;
            for (dataKey in data) {
                var dataValue = data[dataKey],
                    endsWithEl = new RegExp("El$"),
                    elements = 0;
                if(endsWithEl.test(dataKey)){
                    //get the current value of that data field
                    var newKey = dataKey.replace(endsWithEl, "");
                    if (typeof dataValue === "string") {
                        elements = Sizzle(dataValue);
                    } else {
                        elements = dataValue;
                    }
                    switch(elements.length) {
                    case 1:
                        result[newKey] = elements[0].value;
                        break;
                    default:
                        //multiple elements are only allowed for radioboxes
                        //TODO: verbeteren
                        try{
                            for (i=0; i<elements.length; i++) {
                                if (elements[i].nodeName === "INPUT" && elements[i].type === "radio") {
                                    if(elements[i].checked){
                                        result[newKey] = elements[i].value;
                                        break;
                                    }
                                }
                                else throw "only radioboxes allowed";
                            }
                        }
                        catch(err){
                            console.log(err);
                        }
                    }
                } else{
                    result[dataKey] = dataValue;
                }
            }
            return result;
        }
        //submits the request to the Sugestio API.
        //url: the REST page
        function submit(inputData,url) {
            var submitData = getSubmitData(inputData);
            if(submitData.type === "RATING"){
                if(!S.is(submitData.max,"undefined") && !S.is(submitData.min,"undefined") && !S.is(submitData.rating,"undefined")){
                    submitData.detail = "STAR:"+submitData.max+":"+submitData.min+":"+submitData.rating;
                    delete submitData.max;
                    delete submitData.min;
                    delete submitData.rating;
                }
            }
            remoteCall('post', [url, submitData], {
                success: function (resp) {
                    console.log(resp);
                },
                error: function (resp) {
                    console.log("ERROR with " + url + ": " + resp);
                }
            });
        }
        //registers a listener to the trigger elements. If triggered, a request to the Sugestio API will be sent
        function registerSubmit(inputData,url,triggers){
            for (i = 0; i < triggers.length; i++) {
                switch (triggers[i].nodeName) {
                case 'BUTTON':
                    addEvent(triggers[i],'click', function () {
                        submit(inputData,url);
                    });
                    break;
                case 'INPUT':
                    addEvent(triggers[i],'change',function () {
                        if (this.checked) {
                            submit(inputData,url);
                        }
                    });
                    break;
                case 'FORM':
                    addEvent(triggers[i],'submit',function () {
                        submit(inputData,url);
                    });
                    break;
                }
            }
        }
        //User class
        function User(id){
            if(S.is(id,"id")){
                this.id = id;
            } else {
                this.id = null;
            }
        }
        User.prototype.url = "/sites/sandbox/users";
        //Item class
        function Item(id){
            if(S.is(id,"id")){
                this.id = id;
            } else {
                this.id = null;
            }
        }
        Item.prototype.url = "/sites/sandbox/items";
        //helper function: checks the type of an object
        S.is = function(o, type){
            type = type.toLowerCase();
            return  (type == "null" && o === null) ||
                (type == "id" && (typeof o == "number" || typeof o == "string")) ||
                (type == typeof o) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o));
        };
        //user.meta function
        User.prototype.meta = function(obj,el){
            if(!S.is(obj.id,"id") && typeof obj.idEl === "undefined"){
                obj.id = this.id;
            }
            if (typeof el !== "undefined") {
                var triggers = [];
                if (typeof el === "string") {
                    triggers = Sizzle(el);
                } else {
                    triggers.push(el);
                }
                registerSubmit(obj,this.url,triggers);
            } else {
                submit(obj,this.url);
            }
        };
        //static user.meta function
        S.user.meta = function(obj,el){
            User.prototype.meta.apply(User.prototype,[obj,el]);
        };
        //consumption functions
        //TODO: omvormen naar closure!
        for(i=0;i<consumptions.length;i++){
            (function (consumptionName){
                User.prototype[consumptionName] = function(obj,el){
                    var url = "/sites/sandbox/consumptions";
                    obj.userid = this.id;
                    obj.type = consumptionName.toUpperCase();
                    if(S.is(obj.itemid,"id")){
                        if (typeof el !== "undefined") {
                            var triggers = [];
                            if (typeof el === "string") {
                                triggers = Sizzle(el);
                            } else {
                                triggers.push(el);
                            }
                            registerSubmit(obj,url,triggers);
                        } else {
                            submit(obj,url);
                        }
                    } else{
                        console.log("itemid not given");
                    }
                };
            })(consumptions[i]);
        }
        //item.meta function
        Item.prototype.meta = function(obj,el){
            if(!S.is(obj.id,"id")){
                obj.id = this.id;
            }
            if (typeof el !== "undefined") {
                var triggers = [];
                if (typeof el === "string") {
                    triggers = Sizzle(el);
                } else {
                    triggers.push(el);
                }
                registerSubmit(obj,this.url,triggers);
            } else {
                submit(obj,this.url);
            }
        };
        //static item.meta function
        S.item.meta = function(obj,el){
            Item.prototype.meta.apply(Item.prototype,[obj,el]);
        };
        //user.recommendations function
        User.prototype.recommendations = function(func,scope){
            if(S.is(func,"function")){
                remoteCall('get', [this.url + '/' + this.id + '/recommendations.json'], {
                    success: function (resp) {
                        if(S.is(scope,"object")){
                            func.apply(scope, [resp]);
                        } else {
                            func.apply(this, [resp]);
                        }
                    },
                    error: function (resp) {
                        console.log("ERROR: " + resp);
                    }
                });
            } else {
                console.log("func not given");
            }
        };
        //similar function
        function similar(func,scope){
            if(S.is(func,"function")){
                remoteCall('get', [this.url + '/' + this.id + '/similar.json'], {
                    success: function (resp) {
                        if(S.is(scope,"object")){
                            func.apply(scope, [resp]);
                        } else {
                            func.apply(this, [resp]);
                        }
                    },
                    error: function (resp) {
                        console.log("ERROR: " + resp);
                    }
                });
            } else {
                console.log("func not given");
            }
        }
        User.prototype.similar = similar;
        Item.prototype.similar = similar;
        //user.ratingWidget
        User.prototype.ratingWidget = function (data) {
            if (S.is(data,"object") && data.contentEl && data.itemid) {
                var elements = Sizzle(data.contentEl),
                    i = 0;
                for (i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    displayRatingWidget.apply(this,[el, data]);
                }
            }
        };
        window.sugestio = S;
        //displays the rating widget in the DOM element
        function displayRatingWidget(el, data) {
			var itemid = data.itemid, 
			    type = data.type;
            switch (type) {
            case 'star':
				if(typeof data.max === "number" && typeof data.min === "number"){
					var span = document.createElement('span'),
						i = 0,
						inputEls = [];
					span.setAttribute('class', 'rating-widget');
					el.appendChild(span);
					for (i = data.min; i <= data.max; i++) {
						var label = document.createElement('label');
						label.setAttribute('class', 'star-grey');
						function doActionWithSiblings(actionPrev, actionNext) {
							var sibbling = this;
							while (sibbling) {
								actionPrev.apply(this, [sibbling]);
								sibbling = sibbling.previousSibling;
							}
							sibbling = this;
							sibbling = sibbling.nextSibling;
							while (sibbling) {
								actionNext.apply(this, [sibbling]);
								sibbling = sibbling.nextSibling;
							}
						}
						label.onmouseover = function () {
							doActionWithSiblings.apply(this, [function (sibbling) {
								sibbling.className = 'star-orange';
							},
							function (sibbling) {
								sibbling.className = 'star-grey';
							}]);
						};
						label.onclick = function () {
							doActionWithSiblings.apply(this, [function (sibbling) {
								sibbling.className = 'star-orange';
								sibbling.onmouseover = null;
							},
							function (sibbling) {
								sibbling.className = 'star-grey';
								sibbling.onmouseover = null;
							}]);
						};
						var inputEl = document.createElement('input');
						inputEl.setAttribute('name', 'star');
						inputEl.className = 'star';
						inputEl.setAttribute('type', 'radio');
						inputEl.setAttribute('value', i);
						inputEls.push(inputEl);
						if (typeof data.formEl === "undefined") {
							this.rating({'itemid': itemid, detail: 'STAR:'+data.max+':'+data.min+':' + inputEl.value}, inputEl);
						}
						label.appendChild(inputEl);
						span.appendChild(label);
					}
					if (typeof data.formEl !== "undefined" && data.formEl) {
						this.rating({
							'itemid': itemid,
							ratingEl: inputEls,
							max: data.max,
							min: data.min
						}, data.formEl);
					}
				} else {
					console.log('min and max not given');
				}
                break;
            }
        }
        var uuid = 0, remoteCallbacks = {};
        //easyXDM remote call: see documentation
        function remoteCall(method, params, callbacks) {
            var id = uuid++,
                request = JSON.stringify({
                    method: method,
                    params: params,
                    id: id
                });
            remoteCallbacks[id] = callbacks;
            socket.postMessage(request, remoteURL);
        }
    })();
}
// Event API by Dean Edwards in orde to simulate the W3C Event binding in IE browsers
// addEvent/removeEvent written by Dean Edwards, 2005
// with input from Tino Zijdel
// http://dean.edwards.name/weblog/2005/10/add-event/
function addEvent(element, type, handler){
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers){
        handlers = element.events[type] = {};
        // store the existing event handler (if there is one)
        if (element["on" + type]){
            handlers[0] = element["on" + type];
        }
    }
    // store the event handler in the hash table
    handlers[handler.$$guid] = handler;
    // assign a global event handler to do all the work
    element["on" + type] = handleEvent;
};
// a counter used to create unique IDs
addEvent.guid = 1;
/*function removeEvent(element, type, handler){
    // delete the event handler from the hash table
    if (element.events && element.events[type]){
        delete element.events[type][handler.$$guid];
    }
};*/
function handleEvent(event){
    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || fixEvent(window.event);
    // get a reference to the hash table of event handlers
    var handlers = this.events[event.type];
    // execute each event handler
    for (var i in handlers){
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false){
            returnValue = false;
        }
    }
    return returnValue;
};
// Add some "missing" methods to IE's event object
function fixEvent(event){
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};
fixEvent.preventDefault = function(){
    this.returnValue = false;
};
fixEvent.stopPropagation = function(){
    this.cancelBubble = true;
};
//injects a script to the page
function addScript(src, onload) {
    var script = document.createElement('script'),
        head = document.getElementsByTagName("head")[0];
    script.src = src;
    script.type = 'text/javascript';
    if (onload) {
        script.onload = onload;
    }
    head.appendChild(script);
}
//sizzle for getting DOM Elements described by a CSS selector
addScript('SugestioJS/sizzle.js');
//easyXDM for cross domain messaging
addScript('SugestioJS/easyXDM/easyXDM.js', scriptsLoaded);

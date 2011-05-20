// Event API by Dean Edwards in order to simulate the W3C Event binding in IE browsers
// addEvent/removeEvent written by Dean Edwards, 2005
// with input from Tino Zijdel
// http://dean.edwards.name/weblog/2005/10/add-event/
function addEvent(element, type, handler) {
    // assign each event handler a unique ID
    if (!handler.$$guid)
        handler.$$guid = addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events)
        element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers) {
        handlers = element.events[type] = {};
        // store the existing event handler (if there is one)
        if (element["on" + type]) {
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
/*function removeEvent(element, type, handler) {
 // delete the event handler from the hash table
 if (element.events && element.events[type]) {
 delete element.events[type][handler.$$guid];
 }
 };*/
function handleEvent(event) {
    var returnValue = true;
    // grab the event object (IE uses a global event object)
    event = event || fixEvent(window.event);
    // get a reference to the hash table of event handlers
    var handlers = this.events[event.type];
    // execute each event handler
    for (var i in handlers) {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) ===  false) {
            returnValue = false;
        }
    }
    return returnValue;
};

// Add some "missing" methods to IE's event object
function fixEvent(event) {
    // add W3C standard event methods
    event.preventDefault = fixEvent.preventDefault;
    event.stopPropagation = fixEvent.stopPropagation;
    return event;
};

fixEvent.preventDefault = function () {
    this.returnValue = false;
};
fixEvent.stopPropagation = function () {
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
//easyXDM for cross domain messaging
addScript('SugestioJS/easyXDM/easyXDM.js');

/** 
* Gets the sugestio instance
* @param {Object} sugestioOptions The options for the SugestioJS library.
* @return {Object}  Returns the sugestio instance.
*/
function sugestioInit(sugestioOptions) {
    var remoteURL = "http://js.sugestio.com/michiel",
    string = "string",
    nmb = "number",
    i = 0,
    consumptions = "view rating wishlist basket purchase collection checkin".split(" "),
    uuid = 0,
    remoteCallbacks = {},
    //helper function: checks the type of an object
    is = function (o, type) {
        type = type.toLowerCase();
        return (type === "null" && o ===  null) ||
        (type === "id" && (typeof o === "number" || typeof o === "string")) ||
        (type === typeof o && type !== "object") ||
        (type === "array" && Object.prototype.toString.call(o) ===  '[object Array]') ||
        (type === "object" && o ===  Object(o) && Object.prototype.toString.call(o) !==  '[object Array]' );
    },
    isEmptyObject = function (obj) {
        for ( var name in obj ) {
            return false;
        }
        return true;
    },
    buildParams = function (prefix, obj, add) {
        if (is(obj, "array") && obj.length) {
            // Serialize array item.
            for(var i = 0; i < obj.length; i++){
                var v = obj[i];
                buildParams( prefix + "[" + ( typeof v === "object" || is(v, "array") ? i : "" ) + "]", v, add );
            }
        } else if ( obj != null && typeof obj === "object" ) {
            if ( isEmptyObject( obj ) ) {
                add( prefix, "" );
            } else {
                // Serialize object item.
                for ( var name in obj ) {
                    buildParams( prefix + "[" + name + "]", obj[ name ], add );
                }
            }
        } else {
            // Serialize scalar item.
            add(prefix, obj);
        }
    },
    // Serialize an array of form elements or a set of
    // key/values into a query string
    param = function(a) {
        var s = [],
            add = function( key, value ) {
                // If value is a function, invoke it and return its value
                value = is(value, "function") ? value() : value;
                s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
            };

        for ( var prefix in a ) {
            buildParams( prefix, a[ prefix ], add );
        }

        // Return the resulting serialization
        return s.join( "&" );
    },
    //easyXDM remote call: see documentation
    remoteCall = function (method, params, callbacks) {
        var id = uuid++,
            call = {
                method: method,
                params: params,
                id: id
            },
            request = Object.toJSON ? Object.toJSON(call) : JSON.stringify(call); //fix for Prototype<1.7
        remoteCallbacks[id] = callbacks;
        socket.postMessage(request, remoteURL);
    },
    /**
    * Creates a new instance of User
    *
    * @param {String|Integer} id The identification of the user
    * @return {User}   Returns a new User.
    */
    User = function (id) {
        if (is(id, "id")) {
            this.id = id;
        } else {
            this.id = null;
        }
    },
    //Item class
    Item = function (id) {
        if (is(id, "id")) {
            this.id = id;
        } else {
            this.id = null;
        }
    },
    // the sugestio namespace/object
    S = {
        /**
        * Creates a new instance of User
        *
        * @param {String|Integer} a The identification of the user
        * or
        * @param {Function} a A function that returns the identification of the user
        * @param {Object} [b] An optional scope for the function a
        * @return {User}   Returns a new User.
        */
       
        //static functions of the User class are functions binded to this function
        //regular functions are functions bind to the User class
        user: function (a, b) {
            var id = null;
            //(func, scope) OR
            //(userid)
            if (is(a, "function")) {
                if (is(b, "object")) {
                    id = a.apply(b, []);
                } else {
                    id = a.apply(this, []);
                }
            } else {
                id = a;
            }
            return new User(id);
        },
        //sugestio.item: returns the Item class
        //static functions of the Item class are functions binded to this function
        //regular functions are functions bind to the Item class
        item: function (a, b) {
            var id = null;
            //(func, scope) OR
            //(itemid)
            if (is(a, "function")) {
                if (is(b, "object")) {
                    id = a.apply(b, []);
                } else {
                    id = a.apply(this, []);
                }
            } else {
                id = a;
            }
            return new Item(id);
        },
        options: sugestioOptions
    },
    // gets the Authorization parameters
    getAuthorizationParameters = function (data,success,error) {
        // Create the request object
        var xml = new XMLHttpRequest();
        
        // Open the asynchronous POST request
        xml.open("POST", S.options.signerURL, true);
        
        // Set the content-type header, so that the server
        // knows how to interpret the data that we're sending
        xml.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        // Make sure the browser sends the right content length of the serialized data –
        // Mozilla-based browsers sometimes have trouble with this
        if ( xml.overrideMimeType ){
            xml.setRequestHeader("Connection", "close");
        }
        
        // Watch for when the state of the document gets updated
        xml.onreadystatechange = function(){
            // Wait until the data is fully loaded
            if ( xml.readyState == 4 ) {
                if(xml.responseXML){
                    var resp = xml.responseXML,
                        auth = resp.getElementsByTagName('Authorization')[0].firstChild.nodeValue.replace("Authorization: ", ''),
                        xauth = resp.getElementsByTagName('X-Sugestio-signature')[0].firstChild.nodeValue;
                    success(auth,xauth);
                } else {
                    error(xml.status, xml.statusText);
                }
                xml = null;
            }
        };

        // Establish the connection to the server and send the serialized data
        xml.send( param( data ) );
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
                if(remoteCallbacks[id].success){
                    remoteCallbacks[id].success(response.result);
                }
                
            } else {
                if(remoteCallbacks[id].error){
                    remoteCallbacks[id].error(response);
                }
            }
        }
    });
    User.prototype.url = "/sites/" + S.options.account + "/users";
    Item.prototype.url = "/sites/" + S.options.account + "/items";
    //if JSON2 is not supported natively by the browser, this API will do the (de)serialization
    easyXDM.DomHelper.requiresJSON("SugestioJS/easyXDM/json2.js");
    // fix XMLHttpRequest object for IE 5 and IE 6
    if ( typeof XMLHttpRequest == "undefined" ) {
        XMLHttpRequest = function(){
            // Internet Explorer uses an ActiveXObject to create a new
            // XMLHttpRequest object
            return new ActiveXObject(
                // IE 5 uses a different XMLHTTP object from IE 6
                navigator.userAgent.indexOf("MSIE 5") >= 0 ? "Microsoft.XMLHTTP" : "Msxml2.XMLHTTP"
            );
        };
    }
    //gets the values for the Sugestio request
    //if the key ends with "El", we have to get the value of that DOM Element
    function getSubmitData(data) {
        var result = {},
            i = 0,
            dataKey,
            dataValue,
            endsWithEl,
            elements,
            newKey;
        for (dataKey in data) {
            if (data.hasOwnProperty(dataKey)) {
                dataValue = data[dataKey];
                endsWithEl = new RegExp("El$");
                elements = 0;
                if (endsWithEl.test(dataKey)) {
                    //get the current value of that data field
                    newKey = dataKey.replace(endsWithEl, "");
                    if (typeof dataValue ===  "object") {
                        elements = dataValue;
                    } else {
                        //console.log("elements not given");
                    }
                    switch (elements.length) {
                        case 1:
                            result[newKey] = elements[0].value;
                            break;
                        default:
                            //multiple elements are only allowed for radioboxes
                            //TODO: verbeteren en gewone array toelaten
                            try {
                                for (i = 0; i < elements.length; i++) {
                                    if (elements[i].nodeName ===  "INPUT" && elements[i].type ===  "radio") {
                                        if (elements[i].checked) {
                                            result[newKey] = elements[i].value;
                                            break;
                                        }
                                    } else {
                                        throw "only radioboxes allowed";
                                    }
                                }
                            } catch (err) {
                                //console.log(err);
                            }
                    }
                } else {
                    if(is(dataValue,"array")){
                        result[dataKey+"[]"] = dataValue;
                    } else {
                        result[dataKey] = dataValue;
                    }
                }
            }
        }
        return result;
    }
    //submits the request to the Sugestio API.
    //url: the REST page
    function submit(inputData, url) {
        var submitData = getSubmitData(inputData);
        url = S.options.baseURL + url;
        if (submitData.type ===  "RATING") {
            if (!is(submitData.max, "undefined") && !is(submitData.min, "undefined") && !is(submitData.rating, "undefined")) {
                submitData.detail = 'STAR:' + submitData.max + ':' + submitData.min + ':' + submitData.rating;
                delete submitData.max;
                delete submitData.min;
                delete submitData.rating;
            }
        }
        executeSugestioCall(url,'post',submitData);
    }
    function deleteResource(id) {
        var id = id ? id : this.id,
            url = S.options.baseURL + this.url + '/' + id + '.json';
        executeSugestioCall(url,'delete',[]);
    }
    User.prototype.del = deleteResource;
    //static user.meta function
    S.user.del = function () {
        User.prototype.del.apply(User.prototype);
    };
    Item.prototype.del = deleteResource;
    //static user.meta function
    S.item.del = function () {
        Item.prototype.del.apply(User.prototype);
    };
    //registers a listener to the trigger elements. If triggered, the request will be sent to the Sugestio API by the listener function
    function registerListener(listener, inputData, url, triggers) {
        if (!is(triggers, "array") && is(triggers, "object")) {
            triggers = [triggers];
        }
        if (is(triggers, "array")) {
            for (i = 0; i < triggers.length; i++) {
                //console.log(triggers[i].nodeName);
                switch (triggers[i].nodeName) {
                    case 'BUTTON':
                        addEvent(triggers[i],'click', function () {
                            listener.apply(listener,[inputData, url]);
                        });
                        break;
                    case 'INPUT':
                        addEvent(triggers[i],'change', function () {
                            if (this.checked) {
                                listener.apply(listener,[inputData, url]);
                            }
                        });
                        break;
                    case 'FORM':
                        addEvent(triggers[i],'submit', function () {
                            listener.apply(listener,[inputData, url]);
                        });
                        break;
                }
            }
        } else {
            listener.apply(listener,[inputData, url]); //triggers is not an object or array => active the listener instantly
        }
    }

    function checkIdAndRegisterListener(listener) {
        return function(obj,el) {
            if (!is(obj.id, "id") && typeof obj.idEl ===  "undefined") {
                obj.id = this.id;
            }
            registerListener(listener,obj, this.url, el);
        }
    }

    //user.meta function
    User.prototype.meta = checkIdAndRegisterListener(submit);
    //static user.meta function
    S.user.meta = function (obj, el) {
        User.prototype.meta.apply(User.prototype,[obj, el]);
    };
    //item.meta function
    Item.prototype.meta = checkIdAndRegisterListener(submit);
    //static item.meta function
    S.item.meta = function (obj, el) {
        Item.prototype.meta.apply(Item.prototype,[obj, el]);
    };
    //consumption function closure
    function getConsumptionfunction (consumptionName) {
        return function (obj, el) {
            var url = "/sites/" + S.options.account + "/consumptions";
            //if the consumption function is called by using a user object: userid = id from the user object if not already in the obj
            if ((this instanceof User) && is(this.id, "id") && !is(obj.userid, "id") && typeof obj.useridEl ===  "undefined") {
                obj.userid = this.id;
            }
            obj.type = consumptionName.toUpperCase();
            registerListener(submit,obj, url, el);
        };
    }
    //Consumption functions are binded on the Consumption class AND the User class
    for (i = 0;i < consumptions.length;i++) {
        User.prototype[consumptions[i]] = getConsumptionfunction (consumptions[i]);
        S[consumptions[i]] = getConsumptionfunction (consumptions[i]);
    }
    // executes a Sugestio call
    function executeSugestioCall(url,type,data,success,error){
        type = type.toUpperCase();
        if (S.options.secured) {
            getAuthorizationParameters (
                // pass the Sugestio-request to the signer page
                {
                    'request': url,
                    'method': type,
                    'params': JSON.stringify(data)
                },
                // if authorization parameters received
                function (auth, xauth) {
                    remoteCall(type, [url, {data: data, xauth: xauth, auth: auth}], {
                        success: success,
                        error: error
                    });
                },
                // if contacting the signer page failed
                function (status, textStatus) {
                    //console.log("error when contacting signer page");
                }
            );
        } else {
            remoteCall(type, [url, {}], {
                success: success,
                error: error
            });
        }
    }
    //user.recommendations function
    User.prototype.recommendations = function (func) {
        if (is(func, "function")) {
            var url = S.options.baseURL + this.url + '/' + this.id + '/recommendations.json';
            executeSugestioCall(url, 'get', [], func, func);
        } else {
            //console.log("func not given");
        }
    };
    //similar function
    function similar(func) {
        if (is(func, "function")) {
            var url = S.options.baseURL + this.url + '/' + this.id + '/similar.json';
            executeSugestioCall(url, 'get', [], func, func);
        } else {
            //console.log("func not given");
        }
    }
    User.prototype.similar = similar;
    Item.prototype.similar = similar;
    //user.ratingWidget
    S.ratingWidget = function (data) {
        if (is(data, "object") && data.contentEl && data.itemid) {
            if (is(data.contentEl, "array")) {
                var elements = data.contentEl,
                i = 0;
                for (i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    displayRatingWidget.apply(this,[el, data]);
                }
            } else if (is(data.contentEl, "object")){
                displayRatingWidget.apply(this,[data.contentEl, data]);
            }
        }
        //displays the rating widget in the DOM element
        function displayRatingWidget(el, data) {
            var itemid = data.itemid,
            type = data.type;
            switch (type) {
                case 'star':
                    if (typeof data.max ===  "number" && typeof data.min ===  "number") {
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
                                doActionWithSiblings.apply(this, [
                                function (sibbling) {
                                    sibbling.className = 'star-orange';
                                },

                                function (sibbling) {
                                    sibbling.className = 'star-grey';
                                }]);

                            };
                            label.onclick = function () {
                                doActionWithSiblings.apply(this, [
                                function (sibbling) {
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
                            if (typeof data.formEl ===  "undefined") {
                                data.rating = inputEl.value;
                                this.rating(data, inputEl);
                            }
                            label.appendChild(inputEl);
                            span.appendChild(label);
                        }
                        if (typeof data.formEl !==  "undefined" && data.formEl) {
                            data.ratingEl = inputEls;
                            var formEl = data.formEl;
                            delete data.formEl;
                            this.rating(data, formEl);
                        }
                    } else {
                        //console.log('min and max not given');
                    }
                    break;
                case 'thumbs':
                    
            }
        }

    };
    window.sugestio = S;
}
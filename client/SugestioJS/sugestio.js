//first load easyXDM and jQuery, then SugestioJS
function scriptsLoaded() {
    //Anonymous function to protect global vars
    (function () {
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
                    (type === typeof o) ||
                    (type === "array" && Object.prototype.toString.call(o) ===  '[object Array]') ||
                    (type === "object" && o ===  Object(o) && Object.prototype.toString.call(o) !==  '[object Array]');
            },
            //easyXDM remote call: see documentation
            remoteCall = function (method, params, callbacks) {
                var id = uuid++,
                    request = JSON.stringify({
                        method: method,
                        params: params,
                        id: id
                    });
                remoteCallbacks[id] = callbacks;
                socket.postMessage(request, remoteURL);
            },
            //User class
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
            S = { //sugestio object
                //sugestio.user: returns the User class
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
                //sugestio.item: returns the User class
                //static functions of the User class are functions binded to this function
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
                options: {
                    secured: true,
                    signerURL: "http://jsdemo.sugestio.com/demo/signer.php",
                    baseURL: 'http://js.sugestio.com'
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
        User.prototype.url = "/sites/magento/users";
        Item.prototype.url = "/sites/magento/items";
        //if JSON2 is not supported natively by the browser, this API will do the (de)serialization
        easyXDM.DomHelper.requiresJSON("SugestioJS/easyXDM/json2.js");
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
                            console.log("elements not given");
                        }
                        switch (elements.length) {
                        case 1:
                            result[newKey] = elements[0].value;
                            break;
                        default:
                            //multiple elements are only allowed for radioboxes
                            //TODO: verbeteren
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
                                console.log(err);
                            }
                        }
                    } else {
                        result[dataKey] = dataValue;
                    }
                }
            }
            return result;
        }
        //submits the request to the Sugestio API.
        //url: the REST page
        function submit(inputData, url) {
            var submitData = getSubmitData(inputData);
            if (submitData.type ===  "RATING") {
                if (!is(submitData.max, "undefined") && !is(submitData.min, "undefined") && !is(submitData.rating, "undefined")) {
                    submitData.detail = 'STAR:' + submitData.max + ':' + submitData.min + ':' + submitData.rating;
                    delete submitData.max;
                    delete submitData.min;
                    delete submitData.rating;
                }
            }
            if (S.options.secured) {
                $.ajax({
                    'type': 'POST',
                    'url': S.options.signerURL,
                    'data': {
                        'request': S.options.baseURL + url,
                        'method': 'POST',
                        'params': JSON.stringify(submitData)
                    },
                    success: function (resp) {
                        var xauth = resp.getElementsByTagName('X-Sugestio-oauth-hash')[0].firstChild.nodeValue,
                            auth = resp.getElementsByTagName('Authorization')[0].firstChild.nodeValue.replace("Authorization: ", '');
                        remoteCall('post', [url, {data: submitData, xauth: xauth, auth: auth}], {
                            success: function (resp) {
                                //console.log(resp);
                            },
                            error: function (resp) {
                                console.log("ERROR with " + url + ": " + resp);
                            }
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("error when contacting signer page");
                    },
                    dataType: 'xml'
                });
            } else {
                remoteCall('post', [url, {data: submitData}], {
                    success: function (resp) {
                        //console.log(resp);
                    },
                    error: function (resp) {
                        console.log("ERROR with " + url + ": " + resp);
                    }
                });
            }
        }
        //registers a listener to the trigger elements. If triggered, a request to the Sugestio API will be sent
        function registerSubmit(inputData, url, triggers) {
            if (!is(triggers, "array") && is(triggers, "object")) {
                triggers = [triggers];
            }
            if (is(triggers, "array")) {
                for (i = 0; i < triggers.length; i++) {
                    //console.log(triggers[i].nodeName);
                    switch (triggers[i].nodeName) {
                    case 'BUTTON':
                        addEvent(triggers[i],'click', function () {
                            submit(inputData, url);
                        });
                        break;
                    case 'INPUT':
                        addEvent(triggers[i],'change', function () {
                            if (this.checked) {
                                submit(inputData, url);
                            }
                        });
                        break;
                    case 'FORM':
                        addEvent(triggers[i],'submit', function () {
                            submit(inputData, url);
                        });
                        break;
                    }
                } 
            } else {
                submit(inputData, url); //triggers is not an object or array => submit the call instantly
            }
        }
        function meta(obj, el) {
            if (!is(obj.id, "id") && typeof obj.idEl ===  "undefined") {
                obj.id = this.id;
            }
            registerSubmit(obj, this.url, el);
        }
        //user.meta function
        User.prototype.meta = meta;
        //static user.meta function
        S.user.meta = function (obj, el) {
            User.prototype.meta.apply(User.prototype,[obj, el]);
        };
        //consumption function closure
        function getConsumptionfunction (consumptionName) {
            return function (obj, el) {
                var url = "/sites/sandbox/consumptions";
                if (!is(obj.userid, "id") && typeof obj.useridEl ===  "undefined" && is(this.id, "id")) {
                    obj.userid = this.id;
                }
                obj.type = consumptionName.toUpperCase();
                registerSubmit(obj, url, el);
            };
        }
        for (i = 0;i < consumptions.length;i++) {
            User.prototype[consumptions[i]] = getConsumptionfunction (consumptions[i]);
            S[consumptions[i]] = getConsumptionfunction (consumptions[i]);
        }
        //item.meta function
        Item.prototype.meta = meta;
        //static item.meta function
        S.item.meta = function (obj, el) {
            Item.prototype.meta.apply(Item.prototype,[obj, el]);
        };
        //user.recommendations function
        User.prototype.recommendations = function (func, scope) {
            if (is(func, "function")) {
                var url = this.url,
                    id = this.id;
                if (S.options.secured) {
                    $.ajax({
                        'type': 'POST',
                        'url': S.options.signerURL,
                        'data': {
                            'request': S.options.baseURL + url + '/' + id + '/recommendations.json',
                            'method': 'GET',
                            'params': []
                        },
                        success: function (resp) {
                            var xauth = resp.getElementsByTagName('X-Sugestio-oauth-hash')[0].firstChild.nodeValue,
                                auth = resp.getElementsByTagName('Authorization')[0].firstChild.nodeValue.replace("Authorization: ", '');
                            remoteCall('get', [S.options.baseURL + url + '/' + id + '/recommendations.json', {xauth: xauth, auth: auth}], {
                                success: function (resp) {
                                    if (is(scope, "object")) {
                                        func.apply(scope, [resp]);
                                    } else {
                                        func.apply(this, [resp]);
                                    }
                                },
                                error: function (resp) {
                                    console.log("ERROR: " + resp);
                                }
                            });
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log("error when contacting signer page");
                        },
                        dataType: 'xml'
                    });
                } else {
                    remoteCall('get', [S.options.baseURL + url + '/' + id + '/recommendations.json', {}], {
                        success: function (resp) {
                            if (is(scope, "object")) {
                                func.apply(scope, [resp]);
                            } else {
                                func.apply(this, [resp]);
                            }
                        },
                        error: function (resp) {
                            console.log("ERROR: " + resp);
                        }
                    });
                }
            } else {
                console.log("func not given");
            }
        };
        //similar function
        function similar(func, scope) {
            if (is(func, "function")) {
                var url = this.url,
                    id = this.id;
                if (S.options.secured) {
                    $.ajax({
                        'type': 'POST',
                        'url': S.options.signerURL,
                        'data': {
                            'request': S.options.baseURL + url + '/' + id + '/similar.json',
                            'method': 'GET',
                            'params': []
                        },
                        success: function (resp) {
                            var xauth = resp.getElementsByTagName('X-Sugestio-oauth-hash')[0].firstChild.nodeValue,
                                auth = resp.getElementsByTagName('Authorization')[0].firstChild.nodeValue.replace("Authorization: ", '');
                            remoteCall('get', [S.options.baseURL + url + '/' + id + '/similar.json', {xauth: xauth, auth: auth}], {
                                success: function (resp) {
                                    if (is(scope, "object")) {
                                        func.apply(scope, [resp]);
                                    } else {
                                        func.apply(this, [resp]);
                                    }
                                },
                                error: function (resp) {
                                    console.log("ERROR: " + resp);
                                }
                            });
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log("error when contacting signer page");
                        },
                        dataType: 'xml'
                    });
                } else {
                    remoteCall('get', [S.options.baseURL + url + '/' + id + '/similar.json', {}], {
                        success: function (resp) {
                            if (is(scope, "object")) {
                                func.apply(scope, [resp]);
                            } else {
                                func.apply(this, [resp]);
                            }
                        },
                        error: function (resp) {
                            console.log("ERROR: " + resp);
                        }
                    });
                }
            } else {
                console.log("func not given");
            }
        }
        User.prototype.similar = similar;
        Item.prototype.similar = similar;
        //user.ratingWidget
        S.ratingWidget = function (data) {
            if (is(data, "object") && data.contentEl && data.itemid) {
                if (is(data.contentEl, "object") || is(data.contentEl, "array")) {
                    var elements = data.contentEl,
                        i = 0;
                    for (i = 0; i < elements.length; i++) {
                        var el = elements[i];
                        displayRatingWidget.apply(this,[el, data]);
                    }
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
                        console.log('min and max not given');
                    }
                    break;
                }
            }
        };
        window.sugestio = S;
    })();
}
// Event API by Dean Edwards in orde to simulate the W3C Event binding in IE browsers
// addEvent/removeEvent written by Dean Edwards, 2005
// with input from Tino Zijdel
// http://dean.edwards.name/weblog/2005/10/add-event/
function addEvent(element, type, handler) {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
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
// for getting DOM Elements described by a CSS selector
//easyXDM for cross domain messaging
addScript("https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js");
addScript('SugestioJS/easyXDM/easyXDM.js', scriptsLoaded);
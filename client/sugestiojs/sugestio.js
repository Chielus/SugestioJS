function scriptsLoaded() {
    (function () {
        //TODO: sugestio.item(2).similar
        var remoteURL = "http://api.sugestio.com/michiel",
            string = "string",
            nmb = "number",
            i = 0,
            consumptions = "view rating wishlist basket purchase collection checkin".split(" "),
            S = {
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
        function registerSubmit(inputData,url,triggers){
            for (i = 0; i < triggers.length; i++) {
                switch (triggers[i].nodeName) {
                case 'BUTTON':
                    triggers[i].addEventListener('click', function () {
                        submit(inputData,url);
                    }, false);
                    break;
                case 'INPUT':
                    triggers[i].addEventListener('change', function () {
                        if (this.checked) {
                            submit(inputData,url);
                        }
                    }, false);
                    break;
                case 'FORM':
                    triggers[i].addEventListener('submit', function () {
                        submit(inputData,url);
                    }, false);
                    break;
                }
            }
        }       
        function User(id){
            if(S.is(id,"id")){
                this.id = id;
            } else {
                this.id = null;
            }
        }
        User.prototype.url = "/sites/sandbox/users";
        function Item(id){
            if(S.is(id,"id")){
                this.id = id;
            } else {
                this.id = null;
            }
        }
        Item.prototype.url = "/sites/sandbox/items";
        S.is = function(o, type){
            type = type.toLowerCase();
            return  (type == "null" && o === null) ||
                (type == "id" && (typeof o == "number" || typeof o == "string")) ||
                (type == typeof o) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o));
        };
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
        S.user.meta = function(obj,el){
            User.prototype.meta.apply(User.prototype,[obj,el]);
        };
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
        S.item.meta = function(obj,el){
            Item.prototype.meta.apply(Item.prototype,[obj,el]);
        };
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
        User.prototype.ratingWidget = function (data) {
            if (S.is(data,"object") && data.contentEl && data.itemid) {
                var elements = Sizzle(data.contentEl),
                    i = 0;
                for (i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    showRatingWidget.apply(this,[el, data]);
                }
            }
        };
        window.sugestio = S;
        function showRatingWidget(el, data) {
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
addScript('sizzle.js');
addScript('easyXDM/easyXDM.js', scriptsLoaded);
//addScript('easyXDM/requiresJSON.js');


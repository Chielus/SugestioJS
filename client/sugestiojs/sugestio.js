function scriptsLoaded() {
    (function () {
        //TODO: sugestio.item(2).similar
        var remoteURL = "http://api.sugestio.com/michiel",
            userid = null,
            i = 0,
            getSubmitData = function(data) {
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
            },
            sugestio = {
                user: {
                    url: "/sites/sandbox/users",
                    checkData: function(data){
                        if(typeof data.userid !== "number" && data.userid !== "string"){
                            console.log('User not given');
                            return false;
                        }
                        return true;
                    },
                    getSubmitData: function(inputData){
                        var result = getSubmitData(inputData);
                        if(typeof result.userid === "undefined"){
                            result.userid = userid;
                        }
                        return result;
                    }
                },
                item: {
                    url: "/sites/sandbox/items",
                    checkData: function(data){
                        if(typeof data.itemid !== "number" && data.itemid !== "string"){
                            console.log('User not given');
                            return false;
                        }
                        return true;
                    },
                    getSubmitData: getSubmitData
                },
                consumptions: {
                    url: "/sites/sandbox/consumptions",
                    checkData: function(data){
                        if(typeof data.itemid !== "number" && data.itemid !== "string"){
                            console.log('item not given');
                            return false;
                        }
                        if(typeof data.userid !== "number" && data.userid !== "string"){
                            console.log('user not given');
                            return false;
                        }
                        return true;
                    },
                    getSubmitData: function(inputData){
                        var result = getSubmitData(inputData);
                        if(typeof result.userid === "undefined"){
                            result.userid = userid;
                        }
                        return result;
                    }
                },
                url : "/sites/sandbox/"
            },
            functionDescrs = [{
                type: "submit",
                name: "view",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "rating",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: function(inputData){
                    var result = sugestio.consumptions.getSubmitData(inputData);
                    if (typeof result.max === "number" && typeof result.min === "number" && (typeof result.rating === "number" || typeof result.rating === "string")) {
                        result.detail = "STAR:" + result.max + ":" + result.min + ":" + result.rating;
                        delete result.max;
                        delete result.min;
                        delete result.rating;
                    }
                    return result;
                }
            }, {
                type: "submit",
                name: "wishlist",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "basket",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "purchase",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "collection",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "checkin",
                binding: sugestio.consumptions,
                checkData: sugestio.consumptions.checkData,
                getSubmitData: sugestio.consumptions.getSubmitData
            }, {
                type: "submit",
                name: "meta",
                binding: sugestio.user,
                checkData: sugestio.user.checkData,
                getSubmitData: sugestio.user.getSubmitData
            }, {
                type: "submit",
                name: "meta",
                binding: sugestio.item,
                checkData: sugestio.item.checkData,
                getSubmitData: sugestio.item.getSubmitData
            }, {
                type: "recommendations",
                name: "similar",
                binding: sugestio.item,
                checkData: sugestio.user.checkData
            }, {
                type: "recommendations",
                name: "similar",
                binding: sugestio.user,
                checkData: sugestio.user.checkData
            }, {
                type: "recommendations",
                name: "recommendations",
                binding: sugestio.user,
                checkData: sugestio.user.checkData
            }];
            socket = new easyXDM.Socket({
                local: "index.html",
                remote: remoteURL + "/index.html",
                onReady: function () {
                    //if we want to do something when the socket is ready
                },
                onMessage: function (message, origin) {
					console.log(message);
                    var response = JSON.parse(message),
                        id = response.id;
                    if (response.result) {
                        remoteCallbacks[id].success(response.result);
                    } else {
                        remoteCallbacks[id].error(response.message);    
                    }
                }
            });
        window.sugestio = sugestio;
        sugestio.user.login = function (a, b) {
            if (typeof a === "function") {
                if (typeof b === "undefined") {
                    userid = a.apply(this, []);
                } else {
                    userid = a.apply(b, []);
                }
            } else {
                userid = a;
            }
        };
		
        var registerFunction = function (funcDescr) {
            function submit(inputData) {
                if(funcDescr.binding === sugestio.consumptions){
                    inputData.type = funcDescr.name.toUpperCase();
                }
                var submitData = funcDescr.getSubmitData(inputData);
                console.log(submitData);
                if(typeof funcDescr.checkData !== "function" || funcDescr.checkData(submitData)){
                    remoteCall('post', [funcDescr.binding.url, submitData], {
                        success: function (resp) {
                            console.log(resp);
                        },
                        error: function (resp) {
                            console.log("ERROR with " + funcDescr.binding.url +funcDescr.name + ": " + resp);
                        }
                    });
                }
            }
            switch(funcDescr.type){
            case 'recommendations':
                funcDescr.binding[funcDescr.name] = function (func, scope, id) {
                    remoteCall('get', [funcDescr.binding.url + '/' + id + '/' + funcDescr.name + '.json'], {
                        success: function (resp) {
                            if (typeof func === "function") {
                                if(typeof scope !== "undefined"){
                                    func.apply(this, [resp]);
                                } else {
                                    func.apply(scope, [resp]);
                                }
                            }
                        },
                        error: function (resp) {
                            console.log("ERROR: " + resp);
                        }
                    });
                };
                break;
            case 'submit':
                funcDescr.binding[funcDescr.name] = function (inputData, triggerEl) {
                    if (typeof triggerEl !== "undefined") {
                        var triggers = [];
                        if (typeof triggerEl === "string") {
                            triggers = Sizzle(triggerEl);
                        } else {
                            triggers.push(triggerEl);
                        }
                        for (i = 0; i < triggers.length; i++) {
                            switch (triggers[i].nodeName) {
                            case 'BUTTON':
                                triggers[i].addEventListener('click', function () {
                                    submit(inputData);
                                }, false);
                                break;
                            case 'INPUT':
                                triggers[i].addEventListener('change', function () {
                                    if (this.checked) {
                                        submit(inputData);
                                    }
                                }, false);
                                break;
                            case 'FORM':
                                triggers[i].addEventListener('submit', function () {
                                    submit(inputData);
                                }, false);
                                break;
                            }
                        }
                    } else {
                        submit(inputData);
                    }
                };
                break;
            }
        };
        (function () {
            for (i = 0; i<functionDescrs.length; i++) {
                var funcDescr = functionDescrs[i];
                registerFunction(funcDescr);
            }
        })();
        sugestio.ratingWidget = function (data) {
            if (typeof data === "object" && data.contentEl && data.itemid) {
                var elements = Sizzle(data.contentEl),
                    i = 0;
                for (i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    showRatingWidget(el, data);
                }
            }
        };
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
							sugestio.consumptions.rating({'itemid': itemid, detail: 'STAR:'+data.max+':'+data.min+':' + inputEl.value}, inputEl);
						}
						label.appendChild(inputEl);
						span.appendChild(label);
					}
					if (typeof data.formEl !== "undefined" && data.formEl) {
						sugestio.consumptions.rating({
							'itemid': itemid,
							ratingEl: inputEls,
							max: data.max,
							min: data.min
						}, data.formEl);
					}
				} else {
					console.log('min en max vergeten');
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


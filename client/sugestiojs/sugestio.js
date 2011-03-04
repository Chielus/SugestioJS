function scriptsLoaded() {
    (function () {
        var remoteURL = "http://api.sugestio.com/michiel",
            userid = -1,
            i = 0,
            submits = "consumptions items users".split(" "),
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
        window.sugestio = window.sugestio || {};
        sugestio.user = function (a, b) {
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
        sugestio.recommendations = function (func, scope) {
            if (userid !== -1) {
                remoteCall('get', ['/sites/sandbox/users/' + userid + '/recommendations.json'], {
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
            }
        };
		function getData(data) {
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
			//if the type is a rating: format the rating to the detail
			if (result.type === "RATING" && typeof result.detail === "undefined") {
				if (typeof result.max === "number" && typeof result.min === "number" && (typeof result.rating === "number" || typeof result.rating === "string")) {
					result.detail = "STAR:" + result.max + ":" + result.min + ":" + result.rating;
					delete result.max;
					delete result.min;
					delete result.rating;
				}
			}
			return result;
		}
		function call(submitType,data) {
			var data2 = getData(data);
			console.log(data2);
			data2.userid = userid;
			remoteCall('post', ['/sites/sandbox/' + submitType, data2], {
				success: function (resp) {
					console.log(resp);
				},
				error: function (resp) {
					console.log("ERROR with /sites/sandbox/" + urlSuffix + ": " + resp);
				}
			});
		}
        for (i = submits.length; i--;) {
            (function (submitType) {
                sugestio[submitType] = function (data, triggerEl) {
                    if (userid !== -1 && typeof triggerEl !== "undefined") {
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
                                    call(submitType,data);
                                }, false);
                                break;
                            case 'INPUT':
                                triggers[i].addEventListener('change', function () {
                                    if (this.checked) {
                                        call(submitType,data);
                                    }
                                }, false);
                                break;
                            case 'FORM':
								triggers[i].addEventListener('submit', function () {
									call(submitType,data);
								}, false);
								break;
                            }
                        }
                    }
                };
            })(submits[i]);
        }
        sugestio.ratingWidget = function (data) {
            if (typeof data === "object" && data.contentEl && data.type && data.itemid) {
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
							sugestio.consumptions({type: 'RATING', 'itemid': itemid, detail: 'STAR:'+data.max+':'+data.min+':' + inputEl.value}, inputEl);
						}
						label.appendChild(inputEl);
						span.appendChild(label);
					}
					if (typeof data.formEl !== "undefined" && data.formEl) {
						sugestio.consumptions({
							type: 'RATING', 
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


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
        sugestio.recommendations = function (func,scope) {
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
                            var call = function (data) {
                                data.userid = userid;
                                remoteCall('post', ['/sites/sandbox/' + submitType, data], {
                                    success: function (resp) {
                                        console.log(resp);
                                    },
                                    error: function (resp) {
                                        console.log("ERROR with /sites/sandbox/" + urlSuffix + ": " + resp);
                                    }
                                });
                            };
                            switch (triggers[i].nodeName) {
                            case 'BUTTON':
                                triggers[i].addEventListener('click', function () {
                                    call.apply(this, [data]);
                                }, false);
                                break;
                            case 'INPUT':
                                triggers[i].addEventListener('click', function () {
                                    if (this.checked) {
                                        call.apply(this, [data]);
                                    }
                                }, false);
                                break;
                            case 'FORM':
                                switch (data.type) {
                                case 'RATING':
                                    if (typeof data.detailEl === "string") {
                                        var values = Sizzle(data.detailEl, triggers[i]);
                                        triggers[i].addEventListener('submit', function () {
                                            var value = -1,
                                                i = 0;
                                            for (i = 0; i < values.length; i++) {
                                                if (values[i].checked) {
                                                    value = values[i].value;
                                                }
                                            }
                                            var data2 = {
                                                type: data.type,
                                                itemid: data.itemid,
                                                detail: 'RATING:5:1:' + value
                                            };
                                            call.apply(this, [data2]);
                                        }, false);
                                    }
                                    break;
                                }
                                break;
                            }
                            
                        }
                    }
                };
            })(submits[i]);
        }
        sugestio.ratingWidget = function (input) {
            if (input && input.contentEl && input.type && input.itemid) {
                var elements = Sizzle(input.contentEl),
                    i = 0;
                for (i = 0; i < elements.length; i++) {
                    var el = elements[i];
                    showRatingWidget(el, input.itemid, input.type, input.formEl);
                }
            }
        };
        function showRatingWidget(el, itemid, type, formEl) {
            switch (type) {
            case 'star':
                var span = document.createElement('span'),
                    i = 0;
                span.setAttribute('class', 'rating-widget');
                el.appendChild(span);
                for (i = 1; i <= 5; i++) {
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
                    var input = document.createElement('input');
                    input.setAttribute('name', 'star');
                    input.className = 'star';
                    input.setAttribute('type', 'radio');

                    input.setAttribute('value', i);
                    
                    if (typeof formEl === "undefined") {
                        sugestio.consumptions({type: 'RATING', 'itemid': itemid, detail:'STAR:5:1:' + input.value}, input);
                    }
                    label.appendChild(input);
                    span.appendChild(label);
                }
                if (typeof formEl !== "undefined" && formEl) {
                    sugestio.consumptions({
                        type: 'RATING', 
                        'itemid': itemid,
                        detailEl: 'input.star'
                    }, formEl);
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


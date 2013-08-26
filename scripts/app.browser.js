;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "ajax";

function Ajax(actionDefinition){
}
Ajax = Gaffa.createSpec(Ajax, Gaffa.Action);
Ajax.prototype.type = actionType;
Ajax.prototype.method = new Gaffa.Property({
    value: 'GET'
});
Ajax.prototype.auth = new Gaffa.Property();
Ajax.prototype.dataType = 'json';
Ajax.prototype.trigger = function(parent, scope, event){
    this.__super__.trigger.apply(this, arguments);

    var action = this,
        gaffa = this.gaffa,
        data = action.source.value,
        errorHandler = function (error) {
            gaffa.actions.trigger(action.actions.error, action, scope, event);
            gaffa.notifications.notify("store.error." + action.kind, error);
        };

    gaffa.notifications.notify("store.begin." + action.kind);

    if(action.dataType === 'formData'){
        var formData = new FormData();
        for(var key in data){
            if(data.hasOwnProperty(key)){
                data[key] != null && formData.append(key, data[key]);
            }
        }
        data = formData;
    }
    
    var ajaxSettings = {
        cache: action.cache,
        type: action.method.value,
        url: action.url.value || window.location.pathname,
        data: data,
        dataType: action.dataType,
        auth: action.auth.value,
        contentType: action.contentType,
        success:function(data){
            if(gaffa.responseIsError && gaffa.responseIsError(data)){
                errorHandler(data);
                return;
            }
                            
            action.target.set(data);
            
            // Mark a portion of the model as clean after a successful store.
            if(action.cleans !== false && action.target.binding){
                gaffa.model.setDirtyState(action.target.binding, false, action);
            }

            scope = scope || {};

            scope.data = data;
            
            gaffa.actions.trigger(action.actions.success, action, scope, event);
            
            gaffa.notifications.notify("store.success." + action.kind);
        },
        error: errorHandler,
        complete:function(){
            gaffa.actions.trigger(action.actions.complete, action, scope, event);
            gaffa.notifications.notify("store.complete." + action.kind);
        }
    };
    
    if(action.dataType === 'file'){
        data = new FormData();
        data.append("file", action.source.value);
        ajaxSettings.contentType = false;
        ajaxSettings.processData = false;
        ajaxSettings.data = data;
        dataType = false;                
    }
    
    gaffa.ajax(ajaxSettings);
    
};
Ajax.prototype.target = new Gaffa.Property();
Ajax.prototype.source = new Gaffa.Property();
Ajax.prototype.dirty = new Gaffa.Property();
Ajax.prototype.url = new Gaffa.Property();

module.exports = Ajax;
},{"gaffa":11}],2:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "browserStorage";

function BrowserStorage(actionDefinition){
}
BrowserStorage = Gaffa.createSpec(BrowserStorage, Gaffa.Action);
BrowserStorage.prototype.type = actionType;
BrowserStorage.prototype.trigger = function(parent, scope, event){
    this.__super__.trigger.apply(this, arguments);

    var action = this,
        data = action.source.value;

    switch(action.method.value){
        case "get":
            data = window[action.storageType.value + 'Storage'].getItem(action.source.value);
            action.target.set(data ? JSON.parse(data) : undefined);
            break;

        case "set":
            window[action.storageType.value + 'Storage'].setItem(action.target.value, JSON.stringify(data));
            break;
    }
    
};
BrowserStorage.prototype.storageType = new Gaffa.Property({
    value: 'local'
});
BrowserStorage.prototype.method = new Gaffa.Property({
    value: 'get'
});
BrowserStorage.prototype.target = new Gaffa.Property();
BrowserStorage.prototype.source = new Gaffa.Property();

module.exports = BrowserStorage;
},{"gaffa":11}],3:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "conditional";

function Conditional(){}
Conditional = Gaffa.createSpec(Conditional, Gaffa.Action);
Conditional.prototype.type = actionType;
Conditional.prototype.condition = new Gaffa.Property();

Conditional.prototype.trigger = function(parent, scope, event) {
    this.__super__.trigger.apply(this, arguments);

    if (this.condition.value) {
        this.gaffa.actions.trigger(this.actions['true'], this, scope, event);
    } else {
        this.gaffa.actions.trigger(this.actions['false'], this, scope, event);
    }           
};



module.exports =  Conditional;
},{"gaffa":11}],4:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "forEach";

function ForEach(){}
ForEach = Gaffa.createSpec(ForEach, Gaffa.Action);
ForEach.prototype.type = actionType;
ForEach.prototype.target = new Gaffa.Property({
    trackKeys:true
});

ForEach.prototype.trigger = function(parent, scope, event) {
    this.__super__.trigger.apply(this, arguments);

    var items = this.target.value;

    if(!items){
        return;
    }

    var keys = items.__gaffaKeys__;

    for(var i = 0; i < items.length; i++){
        var psudoParent = new EachPsudoParent();
        psudoParent.gaffa = this.gaffa;
        psudoParent.path = this.getPath();
        psudoParent.key = keys ? keys[i] : '' + i;

        var actions = JSON.parse(JSON.stringify(this.actions['forEach']));

        psudoParent.actions.all = actions;
        psudoParent = this.gaffa.initialiseViewItem(psudoParent, psudoParent.gaffa, psudoParent.actions.constructors);

        this.gaffa.actions.trigger(psudoParent.actions.all, psudoParent, scope, event);
    }
};

function EachPsudoParent(){}
EachPsudoParent = Gaffa.createSpec(EachPsudoParent, Gaffa.Action);
EachPsudoParent.prototype.type = 'eachPsudoParent';

module.exports =  ForEach;
},{"gaffa":11}],5:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "push";

function Push(){}
Push = Gaffa.createSpec(Push, Gaffa.Action);
Push.prototype.type = actionType;
Push.prototype.trigger = function(){
    this.__super__.trigger.apply(this, arguments);
    
    var toObject = this.target.value;
    if(toObject == null){
        toObject = [];
        this.target.set(toObject);
    }
    if(Array.isArray(toObject)){
        var fromObj = this.source.value;
        if(!(this.clone && this.clone.value === false)){
            fromObj = this.gaffa.clone(fromObj);
        }
        var pushToBinding = this.gaffa.gedi.paths.append(this.target.binding, this.gaffa.gedi.paths.create(toObject.length.toString()));
        this.gaffa.model.set(pushToBinding, fromObj, this, this.cleans.value ? false : null);
    }else{
        throw "Attempted to push to model property that was not an array, null, or undefined";
    }
};
Push.prototype.target = new Gaffa.Property();
Push.prototype.source = new Gaffa.Property();
Push.prototype.cleans = new Gaffa.Property();



module.exports = Push;
},{"gaffa":11}],6:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "remove";

function Remove(){}
Remove = Gaffa.createSpec(Remove, Gaffa.Action);
Remove.prototype.type = actionType;
Remove.prototype.trigger = function(){
    this.__super__.trigger.apply(this, arguments);
    
    this.gaffa.model.remove(this.target.binding, this, this.cleans.value ? false : null);
};
Remove.prototype.target = new Gaffa.Property();
Remove.prototype.cleans = new Gaffa.Property();



module.exports = Remove;
},{"gaffa":11}],7:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "set";

function Set(){}
Set = Gaffa.createSpec(Set, Gaffa.Action);
Set.prototype.type = actionType;
Set.prototype.trigger = function(){
    this.__super__.trigger.apply(this, arguments);
    
    var fromObj = this.source.value;
    if(!(this.clone && this.clone.value === false)){
        fromObj = this.gaffa.clone(fromObj);
    }
    this.target.set(fromObj, this.cleans.value ? false : null); 
};
Set.prototype.target = new Gaffa.Property();
Set.prototype.source = new Gaffa.Property();
Set.prototype.clone = new Gaffa.Property();
Set.prototype.cleans = new Gaffa.Property();

module.exports = Set;
},{"gaffa":11}],8:[function(require,module,exports){
var Gaffa = require('gaffa'),
    actionType = "toggle";

function Toggle(){}
Toggle = Gaffa.createSpec(Toggle, Gaffa.Action);
Toggle.prototype.type = actionType;
Toggle.prototype.trigger = function(){
    this.__super__.trigger.apply(this, arguments);

    this.target.set(!this.target.value, this);
};
Toggle.prototype.target = new Gaffa.Property();

module.exports = Toggle;
},{"gaffa":11}],9:[function(require,module,exports){
var Gaffa = require('gaffa'),
    behaviourType = 'modelChange';

    
function executeBehaviour(behaviour, value){
    behaviour.gaffa.actions.trigger(behaviour.actions.change, behaviour);
}

function ModelChangeBehaviour(){}
ModelChangeBehaviour = Gaffa.createSpec(ModelChangeBehaviour, Gaffa.Behaviour);
ModelChangeBehaviour.prototype.type = behaviourType;
ModelChangeBehaviour.prototype.condition = new Gaffa.Property({value: true});
ModelChangeBehaviour.prototype.watch = new Gaffa.Property({
    update: function(behaviour, value){
        var gaffa = behaviour.gaffa;

        if(!behaviour.condition.value){
            return;
        }

        var throttleTime = behaviour.throttle;
        if(!isNaN(throttleTime)){
            var now = new Date();
            if(!behaviour.lastTrigger || now - behaviour.lastTrigger > throttleTime){
                behaviour.lastTrigger = now;
                executeBehaviour(behaviour, value);
            }else{
                clearTimeout(behaviour.timeout);
                behaviour.timeout = setTimeout(function(){
                        behaviour.lastTrigger = now;
                        executeBehaviour(behaviour, value);
                    },
                    throttleTime - (now - behaviour.lastTrigger)
                );
            }
        }else{
            executeBehaviour(behaviour, value);
        }
    },
    sameAsPrevious: function(){
        var changed = typeof this.value === 'object' || this.getPreviousHash() !== this.value;
        this.setPreviousHash(this.value);

        return !changed;
    }
});

module.exports = ModelChangeBehaviour;
},{"gaffa":11}],10:[function(require,module,exports){
var Gaffa = require('gaffa'),
    behaviourType = 'pageLoad';

function PageLoadBehaviour(){}
PageLoadBehaviour = Gaffa.createSpec(PageLoadBehaviour, Gaffa.Behaviour);
PageLoadBehaviour.prototype.type = behaviourType;
PageLoadBehaviour.prototype.bind = function(){
    Gaffa.Behaviour.prototype.bind.apply(this, arguments);
    
    this.gaffa.actions.trigger(this.actions.load, this);
};

module.exports = PageLoadBehaviour;
},{"gaffa":11}],11:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn, Matt Ginty & Maurice Butler

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

"use strict";

var Gedi = require('gedi'),
    doc = require('doc-js'),
    crel = require('crel'),
    fastEach = require('fasteach'),
    deepEqual = require('deep-equal'),
    animationFrame = require('./raf.js'),
    requestAnimationFrame = animationFrame.requestAnimationFrame,
    cancelAnimationFrame = animationFrame.cancelAnimationFrame;

// Storage for applications default styles.
var defaultViewStyles;

//internal functions

//***********************************************
//
//      Object.create polyfill
//      https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
//
//***********************************************

Object.create = Object.create || function (o) {
    if (arguments.length > 1) {
        throw new Error('Object.create implementation only accepts the first parameter.');
    }
    function F() {}
    F.prototype = o;
    return new F();
};


//***********************************************
//
//      Create Spec
//      https://github.com/KoryNunn/JavascriptInheritance/blob/master/spec.js
//
//***********************************************

function createSpec(child, parent){
    var parentPrototype;
    
    if(!parent) {
        parent = Object;
    }
    
    if(!parent.prototype) {
        parent.prototype = {};
    }
    
    parentPrototype = parent.prototype;
    
    child.prototype = Object.create(parent.prototype);
    child.prototype.__super__ = parentPrototype;
    
    // Yes, This is 'bad'. However, it runs once per Spec creation.
    var spec = new Function("child", "return function " + child.name + "(){child.prototype.__super__.constructor.apply(this, arguments);return child.apply(this, arguments);}")(child);
    
    spec.prototype = child.prototype;
    spec.prototype.constructor = child.prototype.constructor = spec;
    
    return spec;
}


//***********************************************
//
//      IE indexOf polyfill
//
//***********************************************

//IE Specific idiocy

Array.prototype.indexOf = Array.prototype.indexOf || function(object) {
    fastEach(this, function(value, index) {
        if (value === object) {
            return index;
        }
    });
};

// http://stackoverflow.com/questions/498970/how-do-i-trim-a-string-in-javascript
String.prototype.trim=String.prototype.trim||function(){return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');};

// http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
Array.isArray = Array.isArray || function(obj){
    return Object.prototype.toString.call(obj) === '[object Array]';
};

//End IE land.


//***********************************************
//
//      Array Fast Each
//
//***********************************************

function fastEach(array, callback) {
    for (var i = 0; i < array.length; i++) {
        if(callback(array[i], i, array)) break;
    }
    return array;
};


//***********************************************
//
//      String Formatter
//
//***********************************************

//http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
//changed to a single array argument
String.prototype.format = function (values) {
    return this.replace(/{(\d+)}/g, function (match, number) {
        return (values[number] == undefined || values[number] == null) ? match : values[number];
    }).replace(/{(\d+)}/g, "");
};


//***********************************************
//
//      String De-Formatter
//
//***********************************************

//http://stackoverflow.com/questions/5346158/parse-string-using-format-template
//Haxy de-formatter
String.prototype.deformat = function (template) {

    var findFormatNumbers = /{(\d+)}/g,
        currentMatch,
        matchOrder = [],
        index = 0;

    while ((currentMatch = findFormatNumbers.exec(template)) != null) {
        matchOrder[index] = parseInt(currentMatch[1]);
        index++;
    }

    //http://simonwillison.net/2006/Jan/20/escape/
    var pattern = new RegExp("^" + template.replace(/[-[\]()*+?.,\\^$|#\s]/g, "\\$&").replace(/(\{\d+\})/g, "(.*?)") + "$", "g");

    var matches = pattern.exec(this);

    if (!matches) {
        return false;
    }

    var values = [];

    for (var i = 0; i < matchOrder.length; i++) {
        values.push(matches[matchOrder[i] + 1]);
    }

    return values;
};


//***********************************************
//
//      Parse QueryString
//
//***********************************************

function parseQueryString(url){
    var urlParts = url.split('?'),
        result = {};

    if(urlParts.length>1){

        var queryStringData = urlParts.pop().split("&");
        
        fastEach(queryStringData, function(keyValue){
            var parts = keyValue.split("="),
                key = window.unescape(parts[0]),
                value = window.unescape(parts[1]);
                
            result[key] = value;
        });
    }

    return result;
}


//***********************************************
//
//      To QueryString
//
//***********************************************

function toQueryString(data){
    var queryString = '';

    for(var key in data){
        if(data.hasOwnProperty(key) && data[key] !== undefined){
            queryString += (queryString.length ? '&' : '?') + key + '=' + data[key];
        }
    }

    return queryString;
}


//***********************************************
//
//      Ajax
//
//***********************************************

function ajax(settings){    
    var queryStringData;
    if(typeof settings !== 'object'){
        settings = {};
    }

    if(settings.cache === false){
        settings.data = settings.data || {};
        settings.data['_'] = new Date().getTime();
    }

    if(settings.type.toLowerCase() === 'get' && typeof settings.data === 'object'){
        queryStringData = parseQueryString(settings.url);
        for(var key in settings.data){
            if(settings.data.hasOwnProperty(key)){
                queryStringData[key] = settings.data[key];
            }
        }

        settings.url  = settings.url.split('?').shift() + toQueryString(queryStringData);
        settings.data = null;
    }

    var request = new XMLHttpRequest();

    request.addEventListener("progress", settings.progress, false);
    request.addEventListener("load", function(event){
        if(event.target.status >= 400){
            settings.error && settings.error(event);
            return;
        }
        var data = event.target.responseText;


        if(settings.dataType === 'json'){
            if(data === ''){                
                data = undefined;
            }else{
                try{
                    data = JSON.parse(data);
                }catch(error){
                    settings.error && settings.error(event, error);
                    return;
                }
            }
        }

        settings.success && settings.success(data, event);
    }, false);
    request.addEventListener("error", settings.error, false);
    request.addEventListener("abort", settings.abort, false);
    request.addEventListener("loadend", settings.complete, false);

    request.open(settings.type || "get", settings.url, true);

    // Set default headers
    if(settings.contentType !== false){
        request.setRequestHeader('Content-Type', settings.contentType || 'application/json; charset=utf-8');
    }
    request.setRequestHeader('X-Requested-With', settings.requestedWith || 'XMLHttpRequest');
    request.setRequestHeader('x-gaffa', 'request');
    if(settings.auth){
        request.setRequestHeader('Authorization', settings.auth);
    }

    // Set custom headers
    for(var key in settings.headers){
        request.setRequestHeader(key, settings.headers[key]);            
    }

    if(settings.processData !== false && settings.dataType === 'json'){
        settings.data = JSON.stringify(settings.data);
    }

    request.send(settings.data && settings.data);
}

   
//***********************************************
//
//      Get Closest Item
//
//***********************************************

function getClosestItem(target){
    var viewModel = target.viewModel;

    while(!viewModel && target){
        target = target.parentNode;

        if(target){
            viewModel = target.viewModel;
        }
    }

    return viewModel;
}

   
//***********************************************
//
//      Get Closest Item
//
//***********************************************

function langify(fn, context){
    return function(scope, args){
        var args = args.all();

        return fn.apply(context, args);
    }
}

   
//***********************************************
//
//      Get Distinct Groups
//
//***********************************************

function getDistinctGroups(gaffa, collection, expression){
    var distinctValues = {},
        values = gaffa.model.get('(map items ' + expression + ')', {items: collection});
    
    if(collection && typeof collection === "object"){
        if(Array.isArray(collection)){
            fastEach(values, function(value){
                distinctValues[value] = null;
            });
        }else{
            throw "Object collections are not currently supported";
        }
    }
    
    return Object.keys(distinctValues);
}

//***********************************************
//
//      De-Dom
//
//***********************************************

function deDom(node){
    var parent = node.parentNode,
        nextSibling;
        
    if(!parent){
        return false;
    }
    
    nextSibling = node.nextSibling;
        
    parent.removeChild(node);
    
    return function(){
        if(nextSibling){
            parent.insertBefore(node, nextSibling && nextSibling.parent && nextSibling);
        }else {
            parent.appendChild(node);
        }
    };
}

//***********************************************
//
//      Trigger Action
//
//***********************************************

function triggerAction(action, parent, scope, event) {
    action.trigger(parent, scope, event);
}

//***********************************************
//
//      Trigger Action
//
//***********************************************

function triggerActions(actions, parent, scope, event) {
    if(Array.isArray(actions)){
        fastEach(actions, function(action){
            triggerAction(action, parent, scope, event);
        });
    }
}


//***********************************************
//
//      Insert Function
//
//***********************************************

function insertFunction(selector, renderedElement, insertIndex){
    var target = ((typeof selector === "string") ? document.querySelectorAll(selector)[0] : selector),
        referenceSibling;

    if(target && target.childNodes){
        referenceSibling = target.childNodes[insertIndex];
    }
    if (referenceSibling){
        target.insertBefore(renderedElement, referenceSibling);
    }  else {
        target.appendChild(renderedElement);
    }
}

//***********************************************
//
//      Get ViewItem Path
//
//***********************************************

function getItemPath(item){
    var gedi = item.gaffa.gedi,
        paths = [],
        referencePath,
        referenceItem = item;    

    while(referenceItem){

        if(referenceItem.path != null){
            paths.push(referenceItem.path);
        }

        if(referenceItem.key != null){
            paths.push(gedi.paths.create(referenceItem.key));
        }

        referenceItem = referenceItem.parent;
    }
    
    return gedi.paths.resolve.apply(this, paths.reverse());
}

//***********************************************
//
//      Extend
//
//***********************************************

function extend(target, source){
    var args = Array.prototype.slice.call(arguments),
        target = args[0] || {},
        source = args[1] || {},
        visited = [];
    
    function internalExtend(target, source){
        for(var key in source){
            var sourceProperty = source[key],
                targetProperty = target[key];
                                                        
            if(typeof sourceProperty === "object" && sourceProperty != null){
                if(sourceProperty instanceof Array){
                    targetProperty = new sourceProperty.constructor();
                    fastEach(sourceProperty, function(value){
                        var item = new value.constructor();
                        internalExtend(item, value);
                        targetProperty.push(item);
                    });
                }else if(sourceProperty instanceof Date){
                    targetProperty = new Date(sourceProperty);
                }else{
                    if(visited.indexOf(sourceProperty)>=0){
                        target[key] = sourceProperty;
                        continue;
                    }
                    visited.push(sourceProperty);
                    targetProperty = targetProperty || Object.create(sourceProperty);
                    internalExtend(targetProperty, sourceProperty);
                }
            }else{
                if(targetProperty === undefined){
                    targetProperty = sourceProperty;
                }
            }
            target[key] = targetProperty;
        }
    }
    
    internalExtend(target, source);
    
    if(args[2] !== undefined && args[2] !== null){
        args[0] = args.shift();
        extend.apply(this, args);
    }
    
    return target;
}

//***********************************************
//
//      Same As
//
//***********************************************

function sameAs(a,b){
    var typeofA = typeof a,
        typeofB = typeof b;
        
    if(typeofA !== typeofB){
        return false;
    }
        
    switch (typeof a){
        case 'string': return a === b;
        
        case 'number':
            if(isNaN(a) && isNaN(b)){
                return true;
            }
            return a === b;
        
        case 'date': return +a === +b;
                    
        default: return false;
    }
}

//***********************************************
//
//      Add Default Style
//
//***********************************************

function addDefaultStyle(style){
    defaultViewStyles = defaultViewStyles || (function(){
        defaultViewStyles = crel('style', {type: 'text/css', 'class':'dropdownDefaultStyle'});
    
        //Prepend so it can be overriden easily.
        var addToHead = function(){
            if(window.document.head){
                window.document.head.insertBefore(defaultViewStyles);
            }else{
                setTimeout(addToHead, 100);
            }
        };

        addToHead();
        
        return defaultViewStyles;
    })();

    if (defaultViewStyles.styleSheet) {   // for IE
        defaultViewStyles.styleSheet.cssText = style;
    } else {                // others
        defaultViewStyles.innerHTML += style;
    }
    
}

//***********************************************
//
//      Initialise ViewItem
//
//***********************************************

function initialiseViewItem(viewItem, gaffa, specCollection) {
    if(!(viewItem instanceof ViewItem)){
        if (!specCollection[viewItem.type]) {
            throw "No constructor is loaded to handle view of type " + viewItem.type;
        }            
        viewItem = new specCollection[viewItem.type](viewItem);
    }

    for(var key in viewItem.views){
        if(!(viewItem.views[key] instanceof ViewContainer)){
            viewItem.views[key] = new ViewContainer(viewItem.views[key]);
        }
        var views = viewItem.views[key];
        for (var viewIndex = 0; viewIndex < views.length; viewIndex++) {
            var view = initialiseView(views[viewIndex], gaffa);
            views[viewIndex] = view;
            view.parentContainer = views;
        }
    }
        
    for(var key in viewItem.actions){
        var actions = viewItem.actions[key];
        for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
            var action = initialiseAction(actions[actionIndex], gaffa);
            actions[actionIndex] = action;
            action.parentContainer = actions;
        }
    }
        
    if(viewItem.behaviours){
        for (var behaviourIndex = 0; behaviourIndex < viewItem.behaviours.length; behaviourIndex++) {
            var behaviour = initialiseBehaviour(viewItem.behaviours[behaviourIndex], gaffa);
            viewItem.behaviours[behaviourIndex] = behaviour;
            behaviour.parentContainer = viewItem.behaviours;
        }
    }
    
    return viewItem;
}
    
//***********************************************
//
//      Initialise View
//
//***********************************************

function initialiseView(viewItem, gaffa) {
    return initialiseViewItem(viewItem, gaffa, gaffa.views.constructors);
}
    
//***********************************************
//
//      Initialise Action
//
//***********************************************

function initialiseAction(viewItem, gaffa) { 
    return initialiseViewItem(viewItem, gaffa, gaffa.actions.constructors);
}

    
//***********************************************
//
//      Initialise Behaviour
//
//***********************************************

function initialiseBehaviour(viewItem, gaffa) { 
    return initialiseViewItem(viewItem, gaffa, gaffa.behaviours.constructors);
}    


//***********************************************
//
//      Remove Views
//
//***********************************************

function removeViews(views){
    if(!views){
        return;
    }

    views = views instanceof Array ? views : [views];

    views = views.slice();
    
    fastEach(views, function(viewModel){
        viewModel.remove();
    });
}

//***********************************************
//
//      JSON Converter
//
//***********************************************

function jsonConverter(object, exclude, include){
    var plainInstance = new object.constructor(),
        tempObject = Array.isArray(object) || object instanceof Array && [] || {},
        excludeProps = ["gaffa", "parent", "parentContainer", "renderedElement", "_removeHandlers", "gediCallbacks", "__super__"],
        includeProps = ["type"];
                
    //console.log(object.constructor.name);
    
    if(exclude){
        excludeProps = excludeProps.concat(exclude);
    }

    if(include){
        includeProps = includeProps.concat(include);
    }
    
    for(var key in object){
        if( 
            includeProps.indexOf(key)>=0 ||
            object.hasOwnProperty(key) &&
            excludeProps.indexOf(key)<0 &&
            !deepEqual(plainInstance[key], object[key])
        ){
            tempObject[key] = object[key];
        }
    }

    if(!Object.keys(tempObject).length){
        return;
    }
    
    return tempObject;
}

function createModelScope(parent, trackKeys, gediEvent){
    var possibleGroup = parent,
        groupKey;

    while(possibleGroup && !groupKey){
        groupKey = possibleGroup.group;
        possibleGroup = possibleGroup.parent;
    }

    return {
        __trackKeys__: trackKeys,
        viewItem: parent,
        groupKey: groupKey,
        modelTarget: gediEvent && gediEvent.target
    };
}

function updateProperty(property, firstUpdate){
    // Update immediately, reduces reflows, 
    // as things like classes are added before
    //  the element is inserted into the DOM
    if(firstUpdate){
        property.update(property.parent, property.value);
    }

    // Still run the sameAsPrevious function,
    // because it sets up the last value hash,
    // and it will be false anyway.
    if(!property.sameAsPrevious()){
        if(property.nextUpdate){
            cancelAnimationFrame(property.nextUpdate);
            property.nextUpdate = null;
        }
        property.nextUpdate = requestAnimationFrame(function(){
            property.update(property.parent, property.value);
        });
    }
}

function createPropertyCallback(property){
    return function (event) {
        var value,                        
            scope;

        if(event){                    
            scope = createModelScope(property.parent, property.trackKeys, event);

            
            if(event === true){ // Initial update.
                value = property.gaffa.model.get(property.binding, property, scope);

            } else if(property.binding){ // Model change update.

                if(property.ignoreTargets && event.target.toString().match(property.ignoreTargets)){
                    return;
                }
                value = event.getValue(scope);
            }

            property.keys = value && value.__gaffaKeys__;
            property.value = value;
        }
        
        // Call the properties update function, if it has one.
        // Only call if the changed value is an object, or if it actually changed.
        if(!property.update){
            return;
        }
    
        updateProperty(property, event === true);
    }
}


//***********************************************
//
//      Bind Property
//
//***********************************************

function bindProperty(parent) {
    this.parent = parent;

    // Shortcut for properties that have no binding.
    // This has a significant impact on performance.
    if(this.binding == null){
        if(this.update){
            this.update(parent, this.value);
        }
        return;
    }
            
    var propertyCallback = createPropertyCallback(this);

    this.gaffa.model.bind(this.binding, propertyCallback, this);
    propertyCallback(true);
}


//***********************************************
//
//      Gaffa object.
//
//***********************************************

//Public Objects ******************************************************************************

function createValueHash(value){
    if(value && typeof value === 'object'){
        return Object.keys(value);
    }

    return value;
}

function compareToHash(value, hash){
    if(value && hash && typeof value === 'object' && typeof hash === 'object'){
        var keys = Object.keys(value);
        if(keys.length !== hash.length){
            return;
        }
        for (var i = 0; i < hash.length; i++) {
            if(hash[i] !== keys[i]){
                return;
            }
        };
        return true;
    }

    return value === hash;
}

//***********************************************
//
//      Property Object
//
//***********************************************

function Property(propertyDescription){
    if(typeof propertyDescription === 'function'){
        this.update = propertyDescription;
    }else{
        for(var key in propertyDescription){
            if(propertyDescription.hasOwnProperty(key)){
                this[key] = propertyDescription[key];
            }
        }
    }

    this.gediCallbacks = [];
}
Property = createSpec(Property);
Property.prototype.set = function(value, callUpdate){
    var gaffa = this.gaffa;

    if(callUpdate == null){
        callUpdate = true;
    }

    this.value = value;

    if(this.binding){
        this._previousHash = createValueHash(value);
        gaffa.model.set(
            this.binding,
            this.setTransform ? gaffa.model.get(this.setTransform, this, {value: value}) : value,
            this
        );
    }
    if(callUpdate && this.update){
        this.update(this.parent, value);
    }
}
Property.prototype.sameAsPrevious = function () {
    if(compareToHash(this.value, this._previousHash)){
        return true;
    }
    this._previousHash = createValueHash(this.value);
}
Property.prototype.setPreviousHash = function(hash){
    this._previousHash = hash;
};
Property.prototype.getPreviousHash = function(hash){
    return this._previousHash;
};
Property.prototype.bind = bindProperty;
Property.prototype.debind = function(){
    this.gaffa && this.gaffa.model.debind(this);
};
Property.prototype.getPath = function(){
    return getItemPath(this);
};
Property.prototype.toJSON = function(){
    var tempObject = jsonConverter(this, ['_previousHash']);
    
    return tempObject;
};

//***********************************************
//
//      View Container Object
//
//***********************************************

function ViewContainer(viewContainerDescription){
    var viewContainer = this;
    if(viewContainerDescription instanceof Array){
        for (var i = 0; i < viewContainerDescription.length; i++) {
            viewContainer.push(viewContainerDescription[i]);
        }
    }
}
ViewContainer = createSpec(ViewContainer, Array);
ViewContainer.prototype.bind = function(parent){
    this.parent = parent;
    this.gaffa = parent.gaffa;

    if(this.bound){
        return;
    }

    this.bound = true;
    
    for(var propertyKey in this){
        if(this[propertyKey] instanceof Property){
            this[propertyKey].bind(this);
        }
    }

    return this;
};
ViewContainer.prototype.debind = function(){
    if(!this.bound){
        return;
    }

    this.bound = false;

    for (var i = 0; i < this.length; i++) {
        this[i].debind();
    }
};
ViewContainer.prototype.getPath = function(){
    return getItemPath(this);
};
ViewContainer.prototype.add = function(viewModel, insertIndex){
    // If passed an array
    if(Array.isArray(viewModel)){
        for(var i = 0; i < viewModel.length; i++){
            this.add(viewModel[i]);
        }
        return this;
    }

    this.splice(insertIndex != null ? insertIndex : this.length, 0, viewModel);
    viewModel.parentContainer = this;

    if(this.bound){
        this.render.update(this, this.render.value);
    }

    return this;
};
ViewContainer.prototype.remove = function(viewModel){
    viewModel.remove();
};
ViewContainer.prototype.empty = function(){
    removeViews(this);
};
ViewContainer.prototype.toJSON = function(){
    return jsonConverter(this, ['element']);
};
ViewContainer.prototype.render = new Property({
    update: function(viewContainer, value){
        var i = 0,
            viewContainerLength = viewContainer.length;
        if(value){
            for(; i < viewContainerLength; i++){
                var viewModel = viewContainer[i];
                viewModel.gaffa = viewContainer.gaffa;

                if(viewModel.renderedElement){
                    continue;
                }

                if(viewModel.name){
                    viewContainer.gaffa.namedViews[viewModel.name] = viewModel;
                }


                viewModel.render();
                viewModel.bind(viewContainer.parent);
                viewModel.insert(viewContainer, i);
            }
        }else{
            for(; i < viewContainerLength; i++){
                viewContainer[i].debind();
            }
        }
    },
    value: true
});

function copyProperties(source, target){
    if(
        !source || typeof source !== 'object' ||
        !target || typeof target !== 'object'
    ){
        return;
    }

    for(var key in source){
        if(source.hasOwnProperty(key)){
            target[key] = source[key];
        }
    }
}

function debindViewItem(viewItem){
    for(var key in viewItem){
        if(viewItem[key] instanceof Property){
            viewItem[key].debind();
        }
    }

    viewItem.bound = false;
}

function removeViewItem(viewItem){
    if(!viewItem.parentContainer){
        return;
    }

    var viewIndex = viewItem.parentContainer.indexOf(viewItem);

    if(viewIndex >= 0){
        viewItem.parentContainer.splice(viewIndex, 1);              
    }

    viewItem.debind();

    viewItem.parentContainer = null;
}

//***********************************************
//
//      ViewItem Object
//
//***********************************************

function ViewItem(viewItemDescription){
    
    for(var key in this){
        if(this[key] instanceof Property){
            this[key] = new this[key].constructor(this[key]);
        }
    }
    
    this.actions = {};

    for(var key in viewItemDescription){
        var prop = this[key];
        if(prop instanceof Property || prop instanceof ViewContainer){
            copyProperties(viewItemDescription[key], prop);
        }else{
            this[key] = viewItemDescription[key];
        }
    }
}
ViewItem = createSpec(ViewItem);
ViewItem.prototype.path = '[]';
ViewItem.prototype.bind = function(parent){
    var viewItem = this;

    this.parent = parent;

    this.bound = true;
    
    // Only set up properties that were on the prototype.
    // Faster and 'safer'
    for(var propertyKey in this.constructor.prototype){
        if(this[propertyKey] instanceof Property){
            var property = this[propertyKey];
            property.gaffa = viewItem.gaffa;
            property.bind(this);
        }
    }
};
ViewItem.prototype.debind = function(){
    debindViewItem(this);
};
ViewItem.prototype.remove = function(){        
    removeViewItem(this);
};
ViewItem.prototype.getPath = function(){
    return getItemPath(this);
};
ViewItem.prototype.toJSON = function(){
    return jsonConverter(this);
};

//***********************************************
//
//      View Object
//
//***********************************************

function createEventedActionScope(view, event){
    var scope = createModelScope(view);

    scope.event = {
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        which: event.which,
        target: event.target,
        targetViewItem: getClosestItem(event.target),
        preventDefault: langify(event.preventDefault, event),
        stopPropagation: langify(event.stopPropagation, event)
    };

    return scope;
}

function bindViewEvent(view, eventName){
    return view.gaffa.events.on(eventName, view.renderedElement, function (event) {
        triggerActions(view.actions[eventName], view, createEventedActionScope(view, event), event);
    });
}

function View(viewDescription){
    var view = this;

    view._removeHandlers = [];
    view.behaviours = view.behaviours || [];        
}
View = createSpec(View, ViewItem);

View.prototype.bind = function(parent){
    ViewItem.prototype.bind.apply(this, arguments);

    for(var i = 0; i < this.behaviours.length; i++){
        this.behaviours[i].gaffa = this.gaffa;
        this.behaviours[i].bind(this);
    }

    for(var key in this.actions){
        var actions = this.actions[key],
            off;

        if(actions._bound){
            continue;
        }
        
        actions._bound = true;

        off = bindViewEvent(this, key);

        if(off){
            this._removeHandlers.push(off);
        }
    }
};

View.prototype.detach = function(){
    this.renderedElement && this.renderedElement.parentNode && this.renderedElement.parentNode.removeChild(this.renderedElement);
};

View.prototype.remove = function(){        
    this.detach();
    removeViewItem(this);
}

View.prototype.debind = function () {
    for(var i = 0; i < this.behaviours.length; i++){
        this.behaviours[i].debind();
    }
    while(this._removeHandlers.length){
        this._removeHandlers.pop()();
    }
    debindViewItem(this);
};

View.prototype.render = function(){
    this.renderedElement.viewModel = this;
};

View.prototype.insert = function(viewContainer, insertIndex){
    var view = this,
        gaffa = view.gaffa;

    if(view.afterInsert){
        doc.on('DOMNodeInserted', document, function (event) {
            if(doc.closest(view.renderedElement, event.target)){
                view.afterInsert();
            }
        });
    }

    var renderTarget = this.renderTarget || viewContainer && viewContainer.element || gaffa.views.renderTarget || 'body';
    this.insertFunction(this.insertSelector || renderTarget, this.renderedElement, insertIndex);

};

function Classes(){};
Classes = createSpec(Classes, Property);
Classes.prototype.update = function(view, value){
    if(!('internalClassNames' in view.classes)){
        view.classes.internalClassNames = view.renderedElement.className;
    }

    var internalClassNames = view.classes.internalClassNames,
        classes = [internalClassNames, value].join(' ').trim();
    
    view.renderedElement.className = classes ? classes : null;
};
View.prototype.classes = new Classes();

function Visible(){};
Visible = createSpec(Visible, Property);
Visible.prototype.value = true;
Visible.prototype.update = function(view, value) {
    view.renderedElement.style.display = value ? null : 'none';
};
View.prototype.visible = new Visible();

function Enabled(){};
Enabled = createSpec(Enabled, Property);
Enabled.prototype.value = true;
Enabled.prototype.update = function(view, value) {
    if(!value === !!view.renderedElement.disabled){
        return;
    }
    view.renderedElement[!value ? 'setAttribute' : 'removeAttribute']('disabled','disabled');
};
View.prototype.enabled = new Enabled();

function Title(){};
Title = createSpec(Title, Property);
Title.prototype.update = function(view, value) {
    view.renderedElement[value ? 'setAttribute' : 'removeAttribute']('title',value);
};
View.prototype.title = new Title();

function RenderChildren(){};
RenderChildren = createSpec(RenderChildren, Property);
RenderChildren.prototype.update = function(view, value) {
    if('value' in this){
        for(var key in view.views){
            view.views[key].render.value = value;
        }
    }
};
View.prototype.renderChildren = new RenderChildren();

View.prototype.insertFunction = insertFunction;


//***********************************************
//
//      Container View Object
//
//***********************************************

function ContainerView(viewDescription){
    this.views = this.views || {};
    this.views.content = new ViewContainer(this.views.content);
}
ContainerView = createSpec(ContainerView, View);
ContainerView.prototype.bind = function(parent){
    View.prototype.bind.apply(this, arguments);
    for(var key in this.views){
        var viewContainer = this.views[key];
        
        if(viewContainer instanceof ViewContainer){
            viewContainer.bind(this);
        }
    }
};
ContainerView.prototype.debind = function(){
    View.prototype.debind.apply(this, arguments);
    for(var key in this.views){
        var viewContainer = this.views[key];
        
        if(viewContainer instanceof ViewContainer){
            viewContainer.debind();
        }
    }
};
ContainerView.prototype.remove = function(){
    View.prototype.remove.apply(this, arguments);
    for(var key in this.views){
        var viewContainer = this.views[key];
        
        if(viewContainer instanceof ViewContainer){
            viewContainer.empty();
        }
    }
};


//***********************************************
//
//      Action Object
//
//***********************************************

function Action(actionDescription){
}
Action = createSpec(Action, ViewItem);
Action.prototype.bind = function(){
    ViewItem.prototype.bind.call(this);
};
Action.prototype.trigger = function(parent, scope, event){
    this.parent = parent;

    scope = scope || {};

    var gaffa = this.gaffa = parent.gaffa,
        outerTrackKeys = scope.__trackKeys__;


    for(var propertyKey in this.constructor.prototype){
        var property = this[propertyKey];

        if(property instanceof Property && property.binding){
            property.gaffa = gaffa;
            property.parent = this;
            scope.__trackKeys__ = property.trackKeys;
            property.value = gaffa.model.get(property.binding, this, scope);
        }
    }

    scope.__trackKeys__ = outerTrackKeys;

    this.debind();
};

//***********************************************
//
//      Behaviour Object
//
//***********************************************

function Behaviour(behaviourDescription){}
Behaviour = createSpec(Behaviour, ViewItem);
Behaviour.prototype.toJSON = function(){
    return jsonConverter(this);
};


function Gaffa(){


    var gedi,
        // Create gaffa global.
        gaffa = {};

        
    // Dom accessible instance
    window.addEventListener('DOMContentLoaded', function(){
        document.body.gaffa = gaffa;
    });
    
    // internal varaibles
    
        // Storage for the applications model.
    var internalModel = {},
    
        // Storage for the applications view.
        internalViewItems = [],
        
        // Storage for application actions.
        internalActions = {},
        
        // Storage for application behaviours.
        internalBehaviours = [],
        
        // Storage for application notifications.
        internalNotifications = {},
        
        // Storage for interval based behaviours.
        internalIntervals = [];
        
        
    // Gedi initialisation
    gedi = new Gedi(internalModel);

    // Add gedi instance to gaffa.
    gaffa.gedi = gedi;
    
    // Gedi.Gel extensions
    
    function getSourceKeys(array){            
        return array.__gaffaKeys__ || (function(){
            var arr = [];
            while(arr.length < array.length && arr.push(arr.length.toString()));
            return arr;
        })();
    }

    var originalFilter = gedi.gel.scope.filter;
    gedi.gel.scope.filter = function(scope, args) {
        if(!scope.get('__trackKeys__')){
            return originalFilter(scope, args);
        }
        var args = args.all(),
            sourceArrayKeys,
            filteredList = [];
        
        var array = args[0];
        var functionToCompare = args[1];

        if(!array){
            return undefined;
        }
            
        sourceArrayKeys = getSourceKeys(array);

        filteredList.__gaffaKeys__ = [];
            
        if (args.length < 2) {
            return args;
        }
        
        if (Array.isArray(array)) {
            
            fastEach(array, function(item, index){
                if(typeof functionToCompare === "function"){
                    if(scope.callWith(functionToCompare, [item])){ 
                        filteredList.push(item);
                        filteredList.__gaffaKeys__.push(sourceArrayKeys[index]);
                    }
                }else{
                    if(item === functionToCompare){ 
                        filteredList.push(item);
                        filteredList.__gaffaKeys__.push(sourceArrayKeys[index]);
                    }
                }
            });
            return filteredList;
        
        }else {
            return;
        }
    };
    
    var originalSlice = gedi.gel.scope.slice;
    gedi.gel.scope.slice = function(scope, args) {
        if(!scope.get('__trackKeys__')){
            return originalSlice(scope, args);
        }
        var target = args.next(),
            start,
            end,
            result,
            sourceArrayKeys;

        if(args.hasNext()){
            start = target;
            target = args.next();
        }
        if(args.hasNext()){
            end = target;
            target = args.next();
        }

        if(!Array.isArray(target)){
            return;
        }

        sourceArrayKeys = getSourceKeys(target);

        result = target.slice(start, end);

        result.__gaffaKeys__ = sourceArrayKeys.slice(start, end);
        
        return result;
    };

    // This is pretty dirty..
    function ksort(array, scope, sortFunction){

        if(array.length < 2){
            return array;
        }

        var sourceArrayKeys = getSourceKeys(array),
            source = array.slice(),
            sourceKeys = sourceArrayKeys.slice(),
            left = [],
            pivot = source.splice(source.length/2,1).pop(),
            pivotKey = sourceKeys.splice(sourceKeys.length/2,1).pop(),
            right = [],
            result,
            resultKeys;

        left.__gaffaKeys__ = [];
        right.__gaffaKeys__ = [];

        for(var i = 0; i < source.length; i++){
            var item = source[i];
            if(scope.callWith(sortFunction, [item, pivot]) > 0){           
                right.push(item);
                right.__gaffaKeys__.push(sourceKeys[i]);
            }else{
                left.push(item);
                left.__gaffaKeys__.push(sourceKeys[i]);
            }
        }

        left = ksort(left, scope, sortFunction);

        left.push(pivot);
        left.__gaffaKeys__.push(pivotKey);

        right = ksort(right, scope, sortFunction);

        resultKeys = left.__gaffaKeys__.concat(right.__gaffaKeys__);

        result = left.concat(right);
        result.__gaffaKeys__ = resultKeys;

        return result;
    }
    
    var originalSort = gedi.gel.scope.sort;
    gedi.gel.scope.sort = function(scope, args) {
        if(!scope.get('__trackKeys__')){
            return originalSort(scope, args);
        }

        var target = args.next(),
            sortFunction = args.next(),
            result,
            sourceArrayKeys,
            sortValues = [];

        if(!Array.isArray(target)){
            return;
        }

        result = ksort(target, scope, sortFunction);
        
        return result;
    };

    
    //***********************************************
    //
    //      add Behaviour
    //
    //*********************************************** 
    
    function addBehaviour(behaviour) {
        //if the views isnt an array, make it one.
        if (Array.isArray(behaviour)) {
            fastEach(behaviour, addBehaviour);
            return;
        }

        behaviour.gaffa = gaffa;
        behaviour.parentContainer = internalBehaviours;
        
        behaviour.bind();
        
        internalBehaviours.push(behaviour);
    }

    
    //***********************************************
    //
    //      Add Notification
    //
    //***********************************************
    
    function addNotification(kind, callback){
        internalNotifications[kind] = internalNotifications[kind] || [];
        internalNotifications[kind].push(callback);
    }

    
    //***********************************************
    //
    //      Notify
    //
    //***********************************************
    
    function notify(kind, data){
        var subKinds = kind.split(".");
            
        fastEach(subKinds, function(subKind, index){
            var notificationKind = subKinds.slice(0, index + 1).join(".");
            
            internalNotifications[notificationKind] && fastEach(internalNotifications[notificationKind], function(callback){
                callback(data);
            });
        });
    }


    //***********************************************
    //
    //      QueryString To Model
    //
    //***********************************************
    
    function queryStringToModel(){
        var queryStringData = parseQueryString(window.location.search);
        
        for(var key in queryStringData){
            if(!queryStringData.hasOwnProperty(key)){
                continue;
            }

            if(queryStringData[key]){
                gaffa.model.set(key, queryStringData[key]);
            }else{
                gaffa.model.set(key, null);
            }
        }
    }

    //***********************************************
    //
    //      Load
    //
    //***********************************************
    
    function load(app, target){

        var targetView = gaffa.views;

        if(target){
            var targetParts = target.split('.'),
                targetName = targetParts[0],
                targetViewContainer = targetParts[1];

            targetView = gaffa.namedViews[targetName].views[targetViewContainer];
        }
    
        while(internalIntervals.length){
            clearInterval(internalIntervals.pop());
        }

        //clear state first
        if (app.views) {
            targetView.empty();
        }
        
        //set up state
        if (app.model) {
            gedi.set({});
            gaffa.model.set(app.model, null, null, false);
        }
        if (app.views) {
            fastEach(app.views, function(view, index){
                app.views[index] = initialiseView(view, gaffa);
            });
            targetView.add(app.views);
        }
        if (app.behaviours) {
            fastEach(app.behaviours, function(behaviour, index){
                app.behaviours[index] = initialiseBehaviour(behaviour, gaffa);
            });
            gaffa.behaviours.add(app.behaviours);
        }
        
        queryStringToModel();
    }

    //***********************************************
    //
    //      Navigate
    //
    //***********************************************

    var pageCache = {};

    function navigate(url, target, pushState, data) {

        // Data will be passed to the route as a querystring
        // but will not be displayed visually in the address bar.
        // This is to help resolve caching issues.

        function success (data) {
            var title;

            data.target = target;
                    
            if(data !== undefined && data !== null && data.title){
                title = data.title;
            }
            
            // Always use pushstate unless triggered by onpopstate
            if(pushState !== false) {
                gaffa.pushState(data, title, url);
            }

            pageCache[url] = JSON.stringify(data);
            
            load(data, target);
            
            gaffa.notifications.notify("navigation.success");
            
            window.scrollTo(0,0);
        }

        function error(error){
            gaffa.notifications.notify("navigation.error", error);
        }

        function complete(){
            gaffa.notifications.notify("navigation.complete");
        }
        
        gaffa.notifications.notify("navigation.begin");

        if(gaffa.cacheNavigates !== false && pageCache[url]){
            success(JSON.parse(pageCache[url]));
            complete();
            return;
        }

        gaffa.ajax({
            headers:{
                'x-gaffa': 'navigate'
            },         
            cache: navigator.appName !== 'Microsoft Internet Explorer',
            url: url,
            type: "get",
            data: data, // This is to avoid the cached HTML version of a page if you are bootstrapping.
            dataType: "json",
            success: success,
            error: error,
            complete: complete
        });
    }
    
    //***********************************************
    //
    //      Pop State
    //
    //***********************************************

    gaffa.onpopstate = function(event){
        if(event.state){
            navigate(window.location.toString(), event.state.target, false);
        }
    };

    // Overridable handler
    window.onpopstate = gaffa.onpopstate;

    function addDefaultsToScope(scope){
        scope.windowLocation = window.location.toString();
    }

    extend(gaffa, {
        addDefaultStyle: addDefaultStyle,
        createSpec: createSpec,
        jsonConverter: jsonConverter,
        Path: gedi.Path,
        ViewItem: ViewItem,
        View: View,
        ContainerView: ContainerView,
        Action: Action,
        Behaviour: Behaviour,
        Property: Property,
        ViewContainer: ViewContainer,
        initialiseViewItem: initialiseViewItem,
        events:{
            on: function(eventName, target, callback){
                if('on' + eventName.toLowerCase() in target){
                    return doc.on(eventName, target, callback);
                }
            }
        },
        model: {
            get:function(path, parent, scope) {
                if(!(parent instanceof ViewItem || parent instanceof Property)){
                    scope = parent;
                    parent = undefined;
                }

                var parentPath;
                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }
        
                scope = scope || {};

                addDefaultsToScope(scope);
                
                return gedi.get(path, parentPath, scope);
            },
            set:function(path, value, parent, dirty) {
                var parentPath;

                if(path == null){
                    return;
                }

                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }
                
                gedi.set(path, value, parentPath, dirty);
            },
            remove: function(path, parent, dirty) {
                var parentPath;

                if(path == null){
                    return;
                }
                
                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }
                
                gedi.remove(path, parentPath, dirty);
            },
            bind: function(path, callback, parent) {
                var parentPath;

                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }

                if(!parent.gediCallbacks){
                    parent.gediCallbacks = [];
                }
                
                // Add the callback to the list of handlers associated with the viewItem
                parent.gediCallbacks.push(function(){
                    gedi.debind(callback);
                });
                
                gedi.bind(path, callback, parentPath);
            },
            debind: function(item) {
                while(item.gediCallbacks && item.gediCallbacks.length){
                    item.gediCallbacks.pop()();
                }
            },
            isDirty: function(path, parent) {
                var parentPath;

                if(path == null){
                    return;
                }
                
                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }
                
                return gedi.isDirty(path, parentPath);
            },
            setDirtyState: function(path, value, parent) {
                var parentPath;

                if(path == null){
                    return;
                }

                if(parent && parent.getPath){
                    parentPath = parent.getPath();
                }
                
                gedi.setDirtyState(path, value, parentPath);
            }
        },
        views: {
            insertTarget: null,
            
            //Add a view or viewModels to another view, or the root list of viewModels if a parent isnt passed.
            //Set up the viewModels bindings as they are added.
            add: function(view, insertIndex){
                if(Array.isArray(view)){
                    fastEach(view, gaffa.views.add);
                    return;
                }

                if(view.name){
                    gaffa.namedViews[view.name] = viewItem;
                }

                view.gaffa = gaffa;
                view.parentContainer = internalViewItems;
                view.render();
                view.bind();
                view.insert(internalViewItems, insertIndex);
            },
            
            remove: removeViews,

            empty: function(){
                removeViews(internalViewItems);
            },

            constructors: {}
        },

        namedViews: {},

        actions: {
            trigger: triggerActions,

            constructors: {}
        },

        behaviours: {
            add: addBehaviour,

            constructors: {}
        },

        utils: {
            //See if a property exists on an object without doing if(obj && obj.prop && obj.prop.prop) etc...
            getProp: function (object, propertiesString) {
                var properties = propertiesString.split(Gaffa.pathSeparator).reverse();
                while (properties.length) {
                    var nextProp = properties.pop();
                    if (object[nextProp] !== undefined && object[nextProp] !== null) {
                        object = object[nextProp];
                    } else {
                        return;
                    }
                }
                return object;
            },
            //See if a property exists on an object without doing if(obj && obj.prop && obj.prop.prop) etc...
            propExists: function (object, propertiesString) {
                var properties = propertiesString.split(".").reverse();
                while (properties.length) {
                    var nextProp = properties.pop();
                    if (object[nextProp] !== undefined && object[nextProp] !== null) {
                        object = object[nextProp];
                    } else {
                        return false;
                    }
                }
                return true;
            },
            deDom: deDom
        },

        navigate: navigate,
        
        notifications:{  
            add: addNotification,
            notify: notify
        },
        
        load: function(app, pushPageState){
                    
            var title;
                    
            if(app !== undefined && app !== null && app.title){
                title = app.title;
            }

            if(pushPageState){
                // ToDo: Push state no worksies in exploder.
                gaffa.pushState(app, title, document.location);
            }
            load(app);
        },
        
        //If you want to load the values in query strings into the pages model.
        queryStringToModel: queryStringToModel,
        
        //This is here so i can remove it later and replace with a better verson.
        extend: extend,
        
        clone: function(value){
            if(value != null && typeof value === "object"){
                if(Array.isArray(value)){
                    return value.slice();
                }else if (value instanceof Date) {
                    return new Date(value);
                }else{
                    return extend({}, value);
                }
            }
            return value;
        },
        ajax: ajax,
        crel: crel,
        doc: doc,
        fastEach: fastEach,
        getClosestItem: getClosestItem,
        pushState: function(state, title, location){
            window.history.pushState(state, title, location);
        }
    });

    return gaffa;

}

        
// "constants"
Gaffa.pathSeparator = "/";

Gaffa.Property = Property;
Gaffa.ViewContainer = ViewContainer;
Gaffa.ViewItem = ViewItem;
Gaffa.View = View;
Gaffa.ContainerView = ContainerView;
Gaffa.Action = Action;
Gaffa.createSpec = createSpec;
Gaffa.Behaviour = Behaviour;
Gaffa.addDefaultStyle = addDefaultStyle;

Gaffa.propertyUpdaters = {
    collection: function (viewsName, insert, remove, empty) {
        return function (viewModel, value) {
            var property = this,
                valueLength = 0,
                childViews = viewModel.views[viewsName],
                valueKeys = property.keys,
                calculateValueLength = function(){
                    if(Array.isArray(value)){
                        return value.length;
                    }else if(typeof value === "object"){
                        return Object.keys(value).length;
                    }
                };
                
            if (value && typeof value === "object"){

                var element = viewModel.renderedElement;
                if (element && property.template) {
                    var newView,
                        isEmpty = true;
                    
                    //Remove any child nodes who no longer exist in the data
                    for(var i = 0; i < childViews.length; i++){
                        var childView = childViews[i],
                            existingKey = childView.key;
                            
                        if(
                            (
                                (valueKeys && !(valueKeys.indexOf(existingKey)>=0)) ||
                                !value[childView.key]
                            ) &&
                            childView.containerName === viewsName
                        ){
                            i--;
                            remove(viewModel, value, childView);
                            childView.remove();
                        }
                    }

                    var itemIndex = 0;
                    
                    //Add items which do not exist in the dom
                    for (var key in value) {
                        if(Array.isArray(value) && isNaN(key)){
                            continue;
                        }
                        
                        isEmpty = false;
                        
                        var existingChildView = false;
                        for(var i = 0; i < childViews.length; i++){
                            var child = childViews[i],
                                valueKey = key;
                                
                            if(valueKeys){
                                valueKey = valueKeys[key];
                            }
                                
                            if(child.key === valueKey){
                                existingChildView = child;
                            }
                        }
                        
                        if (!existingChildView) {
                            var newViewKey = key;
                            if(valueKeys){
                                newViewKey = valueKeys[key];
                            }
                            newView = {key: newViewKey, containerName: viewsName};
                            insert(viewModel, value, newView, itemIndex);
                        }

                        itemIndex++;
                    }
                    
                    empty(viewModel, isEmpty);
                }
            }else{
                for(var i = 0; i < childViews.length; i++){
                    var childView = childViews[i];
                    if(childView.containerName === viewsName){
                        i--;
                        remove(viewModel, value, childView); 
                        childView.remove();                           
                    }
                }
                empty(viewModel, true);
            }
        };
    },
    
    group: function (viewsName, insert, remove, empty) {
        return function (viewModel, value) {
            var property = this,
                gaffa = property.gaffa,
                childViews = viewModel.views[viewsName],
                previousGroups = property.previousGroups,
                newView,
                isEmpty;
            
            if (value && typeof value === "object"){
                
                viewModel.distinctGroups = getDistinctGroups(gaffa, property.value, property.expression);

                if(previousGroups){
                    if(previousGroups.length === viewModel.distinctGroups.length){
                        return;
                    }
                    var same = true;
                    fastEach(previousGroups, function(group, index){
                        if(group !== viewModel.distinctGroups[group]){
                            same = false;
                        }
                    });
                    if(same){
                        return;
                    }
                }

                property.previousGroups = viewModel.distinctGroups;

                
                for(var i = 0; i < childViews.length; i++){
                    var childView = childViews[i];
                    if(viewModel.distinctGroups.indexOf(childView.group)<0){
                        childViews.splice(i, 1);
                        i--;
                        remove(viewModel, value, childView);
                    }
                }
                
                fastEach(viewModel.distinctGroups, function(group){
                    var exists = false;
                    fastEach(childViews, function(child){
                        if(child.group === group){
                            exists = true;
                        }
                    });
                    
                    if (!exists) {
                        newView = {group: group};
                        insert(viewModel, value, newView);
                    }
                });
                                            
                isEmpty = !childViews.length;
                                            
                empty(viewModel, isEmpty);
            }else{
                fastEach(childViews, function(childView, index){
                    childViews.splice(index, 1);
                    remove(viewModel, property.value, childView);
                });
            }
        };
    }
};

module.exports = Gaffa;

},{"./raf.js":22,"crel":12,"deep-equal":13,"doc-js":14,"fasteach":15,"gedi":16}],12:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/*

    This code is not formatted for readability, but rather run-speed and to assist compilers.
    
    However, the code's intention should be transparent.
    
    *** IE SUPPORT ***
    
    If you require this library to work in IE7, add the following after declaring crel.
    
    var testDiv = document.createElement('div'),
        testLabel = document.createElement('label');

    testDiv.setAttribute('class', 'a');    
    testDiv['className'] !== 'a' ? crel.attrMap['class'] = 'className':undefined;
    testDiv.setAttribute('name','a');
    testDiv['name'] !== 'a' ? crel.attrMap['name'] = function(element, value){
        element.id = value;
    }:undefined;
    

    testLabel.setAttribute('for', 'a');
    testLabel['htmlFor'] !== 'a' ? crel.attrMap['for'] = 'htmlFor':undefined;
    
    

*/

// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.crel = factory();
  }
}(this, function () {
    // based on http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
    var isNode = typeof Node === 'object'
        ? function (object) { return object instanceof Node }
        : function (object) {
            return object
                && typeof object === 'object'
                && typeof object.nodeType === 'number'
                && typeof object.nodeName === 'string';
        };

    function crel(){
        var document = window.document,
            args = arguments, //Note: assigned to a variable to assist compilers. Saves about 40 bytes in closure compiler. Has negligable effect on performance.
            element = document.createElement(args[0]),
            child,
            settings = args[1],
            childIndex = 2,
            argumentsLength = args.length,
            attributeMap = crel.attrMap;

        // shortcut
        if(argumentsLength === 1){
            return element;
        }

        if(typeof settings !== 'object' || isNode(settings)) {
            --childIndex;
            settings = null;
        }

        // shortcut if there is only one child that is a string    
        if((argumentsLength - childIndex) === 1 && typeof args[childIndex] === 'string' && element.textContent !== undefined){
            element.textContent = args[childIndex];
        }else{    
            for(; childIndex < argumentsLength; ++childIndex){
                child = args[childIndex];
                
                if(child == null){
                    continue;
                }
                
                if(!isNode(child)){
                    child = document.createTextNode(child);
                }
                
                element.appendChild(child);
            }
        }
        
        for(var key in settings){
            if(!attributeMap[key]){
                element.setAttribute(key, settings[key]);
            }else{
                var attr = crel.attrMap[key];
                if(typeof attr === 'function'){     
                    attr(element, settings[key]);               
                }else{            
                    element.setAttribute(attr, settings[key]);
                }
            }
        }
        
        return element;
    }
    
    // Used for mapping one kind of attribute to the supported version of that in bad browsers.
    // String referenced so that compilers maintain the property name.
    crel['attrMap'] = {};
    
    // String referenced so that compilers maintain the property name.
    crel["isNode"] = isNode;
    
    return crel;
}));

},{}],13:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var Object_keys = typeof Object.keys === 'function'
    ? Object.keys
    : function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }
;

var deepEqual = module.exports = function (actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b);
  }
  try {
    var ka = Object_keys(a),
        kb = Object_keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

},{}],14:[function(require,module,exports){
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.doc = factory();
    }
}(this, function () {
    var doc = {},
        window = this.window,
        // Allows instantiation in node for libs that require() it.
        document = window && window.document;

    function isString(thing){
        return typeof thing === 'string';
    }

    function getTarget(target){        
        if(isString(target)){
            return doc.find(target)[0];
        }

        return target;
    }

    doc.find = function(target, query){
        if(query == null){
            query = target;
            target = document;
        }
        target = getTarget(target);
        if(!target){
            return [];
        }
        return target.querySelectorAll(query);
    };

    doc.closest = function(target, query){
        target = getTarget(target);

        while(
            target && 
            target.ownerDocument && 
            !doc.is(target, query)
        ){
            target = target.parentNode;
        }

        return target === document && target !== query ? null : target;
    };

    doc.is = function(target, query){
        target = getTarget(target);
        if(!target.ownerDocument || typeof query !== 'string'){
            return target === query;
        }
        return target === query || Array.prototype.slice.call(doc.find(target.parentNode, query)).indexOf(target) >= 0;
    };

    doc.addClass = function(target, classes){
        target = getTarget(target);

        var classes = classes.split(' '),
            currentClasses = target.className.split(' ');

        for(var i = 0; i < classes.length; i++){
            var classToAdd = classes[i];
            if(!classToAdd || classToAdd === ' '){
                continue;
            }
            if(target.classList){
                target.classList.add(classToAdd);
            } else if(!currentClasses.indexOf(classToAdd)>=0){
                currentClasses.push(classToAdd);
            }
        }
        if(!target.classList){
            target.className = currentClasses.join(' ');
        }
        return this;
    };

    doc.removeClass = function(target, classes){
        target = getTarget(target);

        var classes = classes.split(' '),
            currentClasses = target.className.split(' ');

        for(var i = 0; i < classes.length; i++){
            var classToRemove = classes[i];
            if(!classToRemove || classToRemove === ' '){
                continue;
            }
            if(target.classList){
                target.classList.remove(classToRemove);
                continue;
            }
            var removeIndex = currentClasses.indexOf(classToRemove);
            if(removeIndex >= 0){
                currentClasses.splice(removeIndex, 1);
            }
        }
        if(!target.classList){
            target.className = currentClasses.join(' ');
        }
        return this;
    };

    function addEvent(settings){
        getTarget(settings.target).addEventListener(settings.event, settings.callback, false);
    }

    doc.on = function(events, target, callback, proxy){
        var removeCallbacks = [];
        
        if(typeof events === 'string'){
            events = events.split(' ');
        }

        for(var i = 0; i < events.length; i++){
            var eventSettings = {};
            if(proxy){
                if(proxy === true){
                    proxy = document;
                }
                eventSettings.target = proxy;
                eventSettings.callback = function(event){
                    var closestTarget = doc.closest(event.target, target);
                    if(closestTarget){
                        callback(event, closestTarget);
                    }
                };
            }else{
                eventSettings.target = target;
                eventSettings.callback = callback;
            }

            eventSettings.event = events[i];

            addEvent(eventSettings);

            removeCallbacks.push(eventSettings);
        }

        return function(){
            while(removeCallbacks.length){
                var removeCallback = removeCallbacks.pop();
                getTarget(removeCallback.target).removeEventListener(removeCallback.event, removeCallback.callback);
            }
        }
    };

    doc.off = function(events, target, callback, reference){
        if(typeof events === 'string'){
            events = events.split(' ');
        }

        if(typeof callback !== 'function'){
            reference = callback;
            callback = null;
        }

        reference = reference ? getTarget(reference) : document;

        var targets = find(target, reference);

        for(var targetIndex = 0; targetIndex < targets.length; targetIndex++){
            var currentTarget = targets[targetIndex];

            for(var i = 0; i < events.length; i++){
                currentTarget.removeEventListener(events[i], callback);
            }
        }
    }

    doc.isVisible = function(element){
        while(element.parentNode && element.style.display !== 'none'){
            element = element.parentNode;
        }

        return element === document;
    }

    return doc;
}));
},{}],15:[function(require,module,exports){
function fastEach(items, callback) {
    for (var i = 0; i < items.length && !callback(items[i], i, items);i++) {}
    return items;
}

module.exports = fastEach;
},{}],16:[function(require,module,exports){
//Copyright (C) 2012 Kory Nunn

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var Gel = require('gel-js'),
    createSpec = require('spec-js');
//Create gedi
var gediConstructor = newGedi;

//"constants"
gediConstructor.pathSeparator = "/";
gediConstructor.upALevel = "..";
gediConstructor.currentKey = "#";
gediConstructor.rootPath = "";
gediConstructor.pathStart = "[";
gediConstructor.pathEnd = "]";
gediConstructor.pathWildcard = "*";    

var exceptions = {
    invalidPath: 'Invalid path syntax',
    expressionsRequireGel: 'Gel is required to use Expressions in Gedi'
};

var arrayProto = [];


//***********************************************
//
//      Gedi object.
//
//***********************************************

//Creates the public gedi constructor
function newGedi(model) {
        
    // Storage for the applications model 
    model = model || {};

        // Storage for model event handles
    var internalBindings = [],

        // Storage for tracking the dirty state of the model
        dirtyModel = {},

        // Whether model events are paused
        eventsPaused = false,
        
        // gel instance
        gel;
    
    //internal functions

    //***********************************************
    //
    //      IE indexOf polyfill
    //
    //***********************************************

    //IE Specific idiocy

    Array.prototype.indexOf = Array.prototype.indexOf || function (object) {
        fastEach(this, function (value, index) {
            if (value === object) {
                return index;
            }
        });
    };

    // http://stackoverflow.com/questions/498970/how-do-i-trim-a-string-in-javascript
    String.prototype.trim = String.prototype.trim || function () { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };

    // http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
    Array.isArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    //End IE land.


    //***********************************************
    //
    //      Array Fast Each
    //
    //***********************************************

    function fastEach(array, callback) {
        for (var i = 0; i < array.length; i++) {
            if (callback(array[i], i, array)) break;
        }
        return array;
    }


    //***********************************************
    //
    //      Path token converter
    //
    //***********************************************

    function detectPathToken(substring){
        if (substring.charAt(0) === '[') {
            var index = 1;
                
            do {
                if (
                    (substring.charAt(index) === '\\' && substring.charAt(index + 1) === '\\') || // escaped escapes
                    (substring.charAt(index) === '\\' && (substring.charAt(index + 1) === '[' || substring.charAt(index + 1) === ']')) //escaped braces
                ) {
                    index++;
                }
                else if(substring.charAt(index) === ']'){                        
                    var original = substring.slice(0, index+1);

                    return new PathToken(
                        original,
                        original.length
                    );
                }
                index++;
            } while (index < substring.length);
        }
    }

    //***********************************************
    //
    //      Gel integration
    //
    //***********************************************

    gel = new Gel();

    function PathToken(){}
    PathToken = createSpec(PathToken, Gel.Token);
    PathToken.prototype.precedence = 4;
    PathToken.tokenise = detectPathToken;
    PathToken.prototype.evaluate = function(scope){
        this.result = get(resolvePath(scope.get('_gediModelContext_'), this.original), model);
    };
    gel.tokenConverters.push(PathToken);

    gel.scope.isDirty = function(scope, args){
        var token = args.raw()[0];
        
        return isDirty(resolvePath(scope.get('_gediModelContext_'), (token instanceof PathToken) ? token.original : createPath()));                              
    };

    gel.scope.getAllDirty = function (scope, args) {
        var token = args.raw()[0],
            path = resolvePath(scope.get('_gediModelContext_'), (token instanceof PathToken) && token.original),
            source = get(path, model),
            result,
            itemPath;
            
        if (source == null) {
            return null;
        }

        result = source.constructor();

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                itemPath = resolvePath(path, createPath(key));
                if (result instanceof Array) {
                    isDirty(itemPath) && result.push(source[key]);
                } else {
                    isDirty(itemPath) && (result[key] = source[key]);
                }
            }
        }

        return result;
    };

    //***********************************************
    //
    //      Get
    //
    //***********************************************

    var memoiseCache = {};

    // Lots of similarities between get and set, refactor later to reuse code.
    function get(path, model) {
        if (!path) {
            return model;
        }
            
        var memoiseObject = memoiseCache[path.toString()];
        if(memoiseObject && memoiseObject.model === model){
            return memoiseObject.value;
        }
        
        if(isPathRoot(path)){
            return model;
        }

        var pathParts = pathToParts(path),
            reference = model,
            index = 0,
            pathLength = pathParts.length;

        if(isPathAbsolute(path)){
            index = 1;
        }

        for(; index < pathLength; index++){
            var key = pathParts[index];

            if (reference == null) {
                break;
            } else if (typeof reference[key] === "object") {
                reference = reference[key];
            } else {
                reference = reference[key];

                // If there are still keys in the path that have not been accessed,
                // return undefined.
                if(index < pathLength - 1){
                    reference = undefined;
                }
                break;
            }
        }

        memoiseCache[path] = {
            model: model,
            value: reference
        };

        return reference;
    }
    

    //***********************************************
    //
    //      Overwrite Model
    //
    //***********************************************

    function overwriteModel(replacement, model){
        for (var modelProp in model) {
            delete model[modelProp];
        }
        for (var replacementProp in replacement) {
            model[replacementProp] = replacement[replacementProp];
        }
    }
    

    //***********************************************
    //
    //      Set
    //
    //***********************************************

    function set(path, value, model) {
        // passed a null or undefined path, do nothing.
        if (!path) {
            return;
        }

        memoiseCache = {};

        // If you just pass in an object, you are overwriting the model.
        if (typeof path === "object") {
            value = path;
            path = createRootPath;
        }

        var pathParts = pathToParts(path),
            index = 0,
            pathLength = pathParts.length;

        if(isPathRoot(path)){                
            overwriteModel(value, model);
            return;
        }

        if(isPathAbsolute(path)){
            index = 1;
        }

        var reference = model;

        for(; index < pathLength; index++){
            var key = pathParts[index];
            
            // if we have hit a non-object property on the reference and we have more keys after this one
            // make an object (or array) here and move on.
            if ((typeof reference[key] !== "object" || reference[key] === null) && index < pathLength - 1) {
                if (!isNaN(key)) {
                    reference[key] = [];
                }
                else {
                    reference[key] = {};
                }
            }
            if (index === pathLength - 1) {
                // if we are at the end of the line, set to the model
                reference[key] = value;
            }
                //otherwise, RECURSANIZE!
            else {
                reference = reference[key];
            }
        }
    }

    //***********************************************
    //
    //      Remove
    //
    //***********************************************

    function remove(path, model) {
        var reference = model;

        memoiseCache = {};

        var pathParts = pathToParts(path),
            index = 0,
            pathLength = pathParts.length;

        if(isPathRoot(path)){
            overwriteModel({}, model);
            return;
        }

        if(isPathAbsolute(path)){
            index = 1;
        }

        for(; index < pathLength; index++){
            var key = pathParts[index];                
            //if we have hit a non-object and we have more keys after this one
            if (typeof reference[key] !== "object" && index < pathLength - 1) {
                break;
            }
            if (index === pathLength - 1) {
                // if we are at the end of the line, delete the last key

                if (reference instanceof Array) {
                    reference.splice(key, 1);
                } else {
                    delete reference[key];
                }
            } else {
                reference = reference[key];
            }
        }

        return reference;
    }

    
    //***********************************************
    //
    //      Trigger Binding
    //
    //***********************************************

    function trigger(path) {

        var reference = internalBindings,
            references = [reference],
            target = resolvePath('[/]', path);

        function triggerListeners(reference, sink) {
            if (reference != undefined && reference !== null) {
                for(var index = 0; index < reference.length; index++){
                    var callback = reference[index],
                        callbackBinding = callback.binding,
                        callbackBindingParts,
                        parentPath = callback.parentPath,
                        wildcardIndex = callbackBinding.indexOf(gediConstructor.pathWildcard),
                        wildcardMatchFail;

                    if(wildcardIndex >= 0 && getPathsInExpression(callbackBinding)[0] === callbackBinding){

                        //fully resolve the callback path
                        callbackBindingParts = pathToParts(resolvePath('[/]', callback.parentPath, callbackBinding));

                        //null out the now not needed parent path
                        parentPath = null;

                        fastEach(callbackBindingParts, function(pathPart, i){
                            if(pathPart === gediConstructor.pathWildcard){
                                callbackBindingParts[i] = target[i];
                            }else if (pathPart !== target[i]){
                                return wildcardMatchFail = true;
                            }
                        });
                        if(wildcardMatchFail){
                            continue;
                        }
                    }

                    callback({
                        target: target, 
                        getValue: function(scope, returnAsTokens){
                            return modelGet(callbackBinding, parentPath, scope, returnAsTokens);
                        }
                    });
                }
                
                if (sink) {
                    for (var key in reference) {
                        if (reference.hasOwnProperty(key) && Array.isArray(reference[key])) {
                            triggerListeners(reference[key], sink);
                        }
                    }
                }
            }
        }

        var index = 0;

        if(isPathAbsolute(path)){
            index = 1;
        }

        var pathParts = pathToParts(path);

        for(; index < pathParts.length; index++){
            var key = pathParts[index];
            if (!isNaN(key) || key in arrayProto) {
                key = "_" + key;
            }

            if (reference !== undefined && reference !== null) {
                reference = reference[key];
                references.push(reference);
            }
        }

        // Top down, less likely to cause changes this way.

        while (references.length > 1) {
            reference = references.shift();
            triggerListeners(reference);
        }

        triggerListeners(references.pop(), true);
    }

    //***********************************************
    //
    //      Pause Model Events
    //
    //***********************************************

    function pauseModelEvents() {
        eventsPaused = true;
    }

    //***********************************************
    //
    //      Resume Model Events
    //
    //***********************************************

    function resumeModelEvents() {
        eventsPaused = false;
    }

    //***********************************************
    //
    //      Set Binding
    //
    //***********************************************

    function setBinding(binding, callback, parentPath) {

        var path,
            reference = internalBindings;
        
        callback.binding = callback.binding || binding;
        callback.parentPath = parentPath;
        if(!callback.references){
            callback.references = [];
        }

        //If the binding has opperators in it, break them apart and set them individually.
        if (!createPath(binding)) {
            var paths = getPathsInExpression(binding);

            fastEach(paths, function (path) {
                setBinding(path, callback, parentPath);
            });
            return;
        }

        path = binding;

        callback.references.push(path);
                    
        if (parentPath) {
            path = resolvePath(createRootPath(), parentPath, path);
        }

        // Handle wildcards

        var firstWildcardIndex = path.indexOf(gediConstructor.pathWildcard);
        if(firstWildcardIndex>=0){
            path = path.slice(0, firstWildcardIndex);                
        }
        
        if(isPathRoot(path)){
            reference.push(callback);
            return;
        }

        var index = 0;

        if(isPathAbsolute(path)){
            index = 1;
        }

        var pathParts = pathToParts(path);

        for(; index < pathParts.length; index++){
            var key = pathParts[index];

            //escape properties of the array with an underscore.
            // numbers mean a binding has been set on an array index.
            // array property bindings like length can also be set, and thats why all array properties are escaped.
            if (!isNaN(key) || key in arrayProto) {
                key = "_" + key;
            }

            //if we have more keys after this one
            //make an array here and move on.
            if (typeof reference[key] !== "object" && index < pathParts.length - 1) {
                reference[key] = [];
                reference = reference[key];
            }
            else if (index === pathParts.length - 1) {
                // if we are at the end of the line, add the callback
                reference[key] = reference[key] || [];
                reference[key].push(callback);
            }
                //otherwise, RECURSANIZE! (ish...)
            else {
                reference = reference[key];
            }
        }
    }


    //***********************************************
    //
    //      Remove Binding
    //
    //***********************************************
    
    function removeBinding(path, callback){
        var callbacks;
        
        if(typeof path === 'function'){
            callback = path;
            path = null;
        }

        var parentPath = callback ? callback.parentPath : null;
        
        if(path == null){
            if(callback != null && callback.references){
                fastEach(callback.references, function(path){                        
                    removeBinding(path, callback);
                });
            }else{
                internalBindings = [];
            }
            return;
        }

        var paths = getPathsInExpression(path);
        if(paths.length > 1){
            fastEach(paths, function(path){
                removeBinding(path, callback);
            });
            return;
        }

        var resolvedPathParts = pathToParts(resolvePath(parentPath, path)),
            bindingPathParts = [];

        for(var i = 0; i < resolvedPathParts.length; i++){
            if(parseInt(resolvedPathParts[i]).toString() === resolvedPathParts[i]){
                bindingPathParts[i] = '_' + resolvedPathParts[i];
            }else{
                bindingPathParts[i] = resolvedPathParts[i];
            }
        }

        var escapedPath = createPath(bindingPathParts);

        if(!callback){
            set(escapedPath, [], internalBindings);
        }
        
        callbacks = get(escapedPath, internalBindings);            

        if(!callbacks){
            return;
        }

        for (var i = 0; i < callbacks.length; i++) {                
            if(callbacks[i] === callback){
                callbacks.splice(i, 1);
                return;
            }
        }
    }


    //***********************************************
    //
    //      Get Paths
    //
    //***********************************************
    var memoisedExpressionPaths = {};
    function getPathsInExpression(expression) {
        var paths = [];

        if(memoisedExpressionPaths[expression]){
            return memoisedExpressionPaths[expression];
        }

        if (gel) {
            var tokens = gel.tokenise(expression);
            for(var index = 0; index < tokens.length; index++){
            var token = tokens[index];
                if(token instanceof PathToken){
                    paths.push(token.original);
                }
            }
        } else {
            return memoisedExpressionPaths[expression] = [createPath(expression)];
        }
        return memoisedExpressionPaths[expression] = paths;
    }

    //***********************************************
    //
    //      Path to Raw
    //
    //***********************************************

    function pathToRaw(path) {
        return path && path.slice(1, -1);
    }

    //***********************************************
    //
    //      Raw To Path
    //
    //***********************************************

    function rawToPath(rawPath) {
        return gediConstructor.pathStart + (rawPath == null ? '' : rawPath) + gediConstructor.pathEnd;
    }

    //***********************************************
    //
    //      Get Absolute Path
    //
    //***********************************************

    var memoisePathCache = {};
    function resolvePath() {
        var memoiseKey = '';

        for(var argumentIndex = 0; argumentIndex < arguments.length; argumentIndex++){
            memoiseKey += arguments[argumentIndex];
        }

        if(memoisePathCache[memoiseKey]){
            return memoisePathCache[memoiseKey];
        }

        var absoluteParts = [],
            lastRemoved,
            pathParts,
            pathPart;

        for(var argumentIndex = 0; argumentIndex < arguments.length; argumentIndex++){
            pathParts = pathToParts(arguments[argumentIndex]);

            if(!pathParts || !pathParts.length){
                continue;
            }

            for(var pathPartIndex = 0; pathPartIndex < pathParts.length; pathPartIndex++){
                pathPart = pathParts[pathPartIndex];

                if(pathParts.length === 0){
                    // Empty path, maintain parent path.
                } else if (pathPart === gediConstructor.currentKey) {
                    // Has a last removed? Add it back on.
                    if(lastRemoved != null){
                        absoluteParts.push(lastRemoved);
                        lastRemoved = null;
                    }
                } else if (pathPart === gediConstructor.rootPath) {
                    // Root path? Reset parts to be absolute.
                    absoluteParts = [''];

                } else if (pathPart === gediConstructor.upALevel) {
                    // Up a level? Remove the last item in absoluteParts
                    lastRemoved = absoluteParts.pop();
                } else if (pathPart.slice(0,2) === gediConstructor.upALevel) {
                    var argument = pathPart.slice(2);
                    //named
                    while(absoluteParts.slice(-1).pop() !== argument){
                        if(absoluteParts.length === 0){
                            throw "Named path part was not found: '" + pathPart + "', in path: '" + path + "'.";
                        }
                        lastRemoved = absoluteParts.pop();
                    }
                } else {
                    // any following valid part? Add it to the absoluteParts.
                    absoluteParts.push(pathPart);
                }
            }
        }

        // Convert the absoluteParts to a Path and memoise the result.
        return memoisePathCache[memoiseKey] = createPath(absoluteParts);
    }

    //***********************************************
    //
    //      Model Get
    //
    //***********************************************

    function modelGet(binding, parentPath, scope, returnAsTokens) {
        if(parentPath && typeof parentPath !== "string"){
            scope = parentPath;
            parentPath = createPath();
        }

        if (binding && gel) {
            var gelResult,
                expression = binding;

            scope = scope || {};

            scope['_gediModelContext_'] = parentPath;

            return gel.evaluate(expression, scope, returnAsTokens);
        }
        
        parentPath = parentPath || createPath();
        
        binding = resolvePath(parentPath, binding);
        
        return get(binding, model);
    }

    //***********************************************
    //
    //      Model Set
    //
    //***********************************************

    function modelSet(path, value, parentPath, dirty) {
        if(typeof path === 'object' && !createPath(path)){
            dirty = value;
            value = path;
            path = createRootPath();
        }else if(typeof parentPath === 'boolean'){
            dirty = parentPath;
            parentPath = undefined;
        }
        
        parentPath = parentPath || createPath();
        
        path = resolvePath(parentPath, path);

        setDirtyState(path, dirty);
        set(path, value, model);
        trigger(path);
    }

    //***********************************************
    //
    //      Model Remove
    //
    //***********************************************

    function modelRemove(path, parentPath, dirty) {
        if(parentPath instanceof Boolean){
            dirty = parentPath;
            parentPath = undefined;
        }
        
        parentPath = parentPath || createPath();
        
        path = resolvePath(parentPath, path);            
        
        setDirtyState(path, dirty);

        var reference = remove(path, model);

        if(Array.isArray(reference)){
            //trigger one above
            path = resolvePath('[/]', appendPath(path, createPath(gediConstructor.upALevel)));
        }

        trigger(path);
    }

    //***********************************************
    //
    //      Set Dirty State
    //
    //***********************************************  

    function setDirtyState(path, dirty, parentPath) {

        var reference = dirtyModel;
        
        if(!createPath(path)){
            throw exceptions.invalidPath;
        }

        parentPath = parentPath || createPath();
        

        dirty = dirty !== false;

        if(isPathRoot(path)){                
            dirtyModel = {
                '_isDirty_': dirty
            };
            return;
        }

        var index = 0;

        if(isPathAbsolute(path)){
            index = 1;
        }

        var pathParts = pathToParts(resolvePath(parentPath, path));

        for(; index < pathParts.length; index++){
            var key = pathParts[index];
            if ((typeof reference[key] !== "object" || reference[key] === null) && index < pathParts.length - 1) {
                reference[key] = {};
            }
            if (index === pathParts.length - 1) {
                reference[key] = {};
                reference[key]['_isDirty_'] = dirty;
            }
            else {
                reference = reference[key];
            }
        }
        
        if(!pathParts.length){
            dirtyModel['_isDirty_'] = dirty;
        }
    }

    //***********************************************
    //
    //      Is Dirty
    //
    //***********************************************  

    function isDirty(path) {
        var reference,
            hasDirtyChildren = function (ref) {
                if (typeof ref !== 'object') {
                    return false;
                }
                if (ref['_isDirty_']) {
                    return true;
                } else {
                    for (var key in ref) {
                        if (hasDirtyChildren(ref[key])) {
                            return true;
                        }
                    }
                }
            };

        reference = get(path, dirtyModel);

        return !!hasDirtyChildren(reference);
    }

    //Public Objects ******************************************************************************

    var memoisedPathTokens = {};

    function createPath(path){

        if(path == null){
            return rawToPath();
        }

        // passed in an Expression or an 'expression formatted' Path (eg: '[bla]')            
        if(memoisedPathTokens[path]){
            return memoisedPathTokens[path];
        }else if (typeof path === "string"){
            if(path.charAt(0) === gediConstructor.pathStart) {
                var pathString = path.toString(),
                    detectedPathToken = detectPathToken(pathString);

                if (detectedPathToken && detectedPathToken.length === pathString.length) {
                    return memoisedPathTokens[pathString] = detectedPathToken.original;
                } else {
                    return false;
                }
            }else{
                return createPath(rawToPath(path));
            }
        }

        if(path instanceof Array) {
            
            var parts = [];
            for (var i = 0; i < path.length; i++) {
                var pathPart = path[i];
                if(pathPart.indexOf('\\') >= 0){
                    pathPart = pathPart.replace(/([\[|\]|\\|\/])/g, '\\$1');
                }
                parts.push(pathPart);
            }
            return rawToPath(parts.join(gediConstructor.pathSeparator));
        }
    }

    function createRootPath(){
        return createPath([gediConstructor.rootPath, gediConstructor.rootPath]);
    }

    function pathToParts(path){
        if(!path){
            return;
        }
        if(Array.isArray(path)){
            return path;
        }

        path = path.slice(1,-1);

        var lastPartIndex = 0,
            parts,
            nextChar,
            currentChar;

        if(path.indexOf('\\') < 0){
            if(path === ""){
                return [];
            }
            return path.split(gediConstructor.pathSeparator);
        }

        parts = [];

        for(var i = 0; i < path.length; i++){
            currentChar = path.charAt(i);
            if(currentChar === gediConstructor.pathSeparator){
                parts.push(path.slice(lastPartIndex,i));
                lastPartIndex = i+1;
            }else if(currentChar === '\\'){
                nextChar = path.charAt(i+1);
                if(nextChar === '\\'){
                    path = path.slice(0, i) + path.slice(i + 1);
                }else if(nextChar === ']' || nextChar === '['){
                    path = path.slice(0, i) + path.slice(i + 1);
                }else if(nextChar === gediConstructor.pathSeparator){
                    parts.push(path.slice(lastPartIndex), i);
                }
            }
        }
        parts.push(path.slice(lastPartIndex));        

        return parts;
    }

    function appendPath(){
        var parts = pathToParts(arguments[0]);

        for (var argumentIndex = 1; argumentIndex < arguments.length; argumentIndex++) {
            var pathParts = pathToParts(arguments[argumentIndex]);
            for (var partIndex = 0; partIndex < pathParts.length; partIndex++) {
                    parts.push(pathParts[partIndex]);
            }
        }

        return createPath(parts);
    }

    function isPathAbsolute(path){
        return pathToParts(path)[0] === gediConstructor.rootPath;
    }

    function isPathRoot(path){
        var parts = pathToParts(path);
        return (isPathAbsolute(parts) && parts[0] === parts[1]) || parts.length === 0;
    }

    function Gedi() {
        
    }

    Gedi.prototype = {
        paths: {
            create: createPath,
            resolve: resolvePath,
            isRoot: isPathRoot,
            isAbsolute: isPathAbsolute,
            append: appendPath
        },

        get: modelGet,

        set: modelSet,

        remove: modelRemove,
        
        utils: {
            get:get,
            set:set
        },

        init: function (model) {
            this.set(model, false);
        },

        bind: setBinding,

        debind: removeBinding,

        trigger: trigger,

        isDirty: isDirty,

        setDirtyState: setDirtyState,

        gel: gel, // expose gel instance for extension

        getNumberOfBindings: function(){
            function getNumCallbacks(reference){
                var length = reference.length;
                for (var key in reference) {
                    if(isNaN(key)){
                        length += getNumCallbacks(reference[key]);
                    }
                }
                return length;
            }

            return getNumCallbacks(internalBindings);
        }
    };

    return new Gedi();
}

module.exports = gediConstructor;
},{"gel-js":17,"spec-js":21}],17:[function(require,module,exports){
var Lang = require('lang-js'),
    createNestingParser = Lang.createNestingParser,
    detectString = Lang.detectString,
    Token = Lang.Token,
    Scope = Lang.Scope,
    createSpec = require('spec-js');

function fastEach(items, callback) {
    for (var i = 0; i < items.length; i++) {
        if (callback(items[i], i, items)) break;
    }
    return items;
}

function stringFormat(string, values){    
    return string.replace(/{(\d+)}/g, function(match, number) { 
        return values[number] != null
          ? values[number]
          : ''
        ;
    });
}

function isIdentifier(substring){
    var valid = /^[$A-Z_][0-9A-Z_$]*/i,
        possibleIdentifier = substring.match(valid);

    if (possibleIdentifier && possibleIdentifier.index === 0) {
        return possibleIdentifier[0];
    }
}

function tokeniseIdentifier(substring){
    // searches for valid identifiers or operators
    //operators
    var operators = "!=<>/&|*%-^?+\\",
        index = 0;
        
    while (operators.indexOf(substring.charAt(index)||null) >= 0 && ++index) {}

    if (index > 0) {
        return substring.slice(0, index);
    }

    var identifier = isIdentifier(substring);

    if(identifier != null){
        return identifier;                        
    }
}

function createKeywordTokeniser(Constructor, keyword){
    return function(substring){
        substring = isIdentifier(substring);
        if (substring === keyword) {
            return new Constructor(substring, substring.length);
        }
    };
}

function StringToken(){}
StringToken = createSpec(StringToken, Token);
StringToken.prototype.precedence = 2;
StringToken.prototype.stringTerminal = '"';
StringToken.prototype.name = 'double quoted string';
StringToken.tokenise = function (substring) {
    if (substring.charAt(0) === this.prototype.stringTerminal) {
        var index = 0,
        escapes = 0;
               
        while (substring.charAt(++index) !== this.prototype.stringTerminal)
        {
           if(index >= substring.length){
                   throw "Unclosed " + this.name;
           }
           if (substring.charAt(index) === '\\' && substring.charAt(index+1) === this.prototype.stringTerminal) {
                   substring = substring.slice(0, index) + substring.slice(index + 1);
                   escapes++;
           }
        }

        return new this(
            substring.slice(0, index+1),
            index + escapes + 1
        );
    }
}
StringToken.prototype.evaluate = function () {
    this.result = this.original.slice(1,-1);
}

function String2Token(){}
String2Token = createSpec(String2Token, StringToken);
String2Token.prototype.stringTerminal = "'";
String2Token.prototype.name = 'single quoted string';
String2Token.tokenise = StringToken.tokenise;

function ParenthesesToken(){
}
ParenthesesToken = createSpec(ParenthesesToken, Token);
ParenthesesToken.prototype.name = 'parentheses';
ParenthesesToken.tokenise = function(substring) {
    if(substring.charAt(0) === '(' || substring.charAt(0) === ')'){
        return new ParenthesesToken(substring.charAt(0), 1);
    }
}
ParenthesesToken.prototype.parse = createNestingParser(/^\($/,/^\)$/);
ParenthesesToken.prototype.evaluate = function(scope){
    scope = new Scope(scope);
        
    var functionToken = this.childTokens[0];

    if(!functionToken){
        throw "Invalid function call. No function was provided to execute.";
    }
    
    functionToken.evaluate(scope);

    if(typeof functionToken.result !== 'function'){
        throw functionToken.original + " (" + functionToken.result + ")" + " is not a function";
    }
        
    this.result = scope.callWith(functionToken.result, this.childTokens.slice(1), this);
};

function NumberToken(){}
NumberToken = createSpec(NumberToken, Token);
NumberToken.prototype.name = 'number';
NumberToken.tokenise = function(substring) {
    var specials = {
        "NaN": Number.NaN,
        "-NaN": Number.NaN,
        "Infinity": Infinity,
        "-Infinity": -Infinity
    };
    for (var key in specials) {
        if (substring.slice(0, key.length) === key) {
            return new NumberToken(key, key.length);
        }
    }

    var valids = "0123456789-.Eex",
        index = 0;
        
    while (valids.indexOf(substring.charAt(index)||null) >= 0 && ++index) {}

    if (index > 0) {
        var result = substring.slice(0, index);
        if(isNaN(parseFloat(result))){
            return;
        }
        return new NumberToken(result, index);
    }

    return;
};
NumberToken.prototype.evaluate = function(scope){        
    this.result = parseFloat(this.original);
};

function NullToken(){}
NullToken = createSpec(NullToken, Token);
NullToken.prototype.name = 'semicolon';
NullToken.prototype.precedence = 2;
NullToken.tokenise = createKeywordTokeniser(NullToken, "null");
NullToken.prototype.evaluate = function(scope){
    this.result = null;
};

function UndefinedToken(){}
UndefinedToken = createSpec(UndefinedToken, Token);
UndefinedToken.prototype.name = 'undefined';
UndefinedToken.prototype.precedence = 2;
UndefinedToken.tokenise = createKeywordTokeniser(UndefinedToken, 'undefined');
UndefinedToken.prototype.evaluate = function(scope){
    this.result = undefined;
};

function TrueToken(){}
TrueToken = createSpec(TrueToken, Token);
TrueToken.prototype.name = 'true';
TrueToken.prototype.precedence = 2;
TrueToken.tokenise = createKeywordTokeniser(TrueToken, 'true');
TrueToken.prototype.evaluate = function(scope){
    this.result = true;
};

function FalseToken(){}
FalseToken = createSpec(FalseToken, Token);
FalseToken.prototype.name = 'false';
FalseToken.prototype.precedence = 2;
FalseToken.tokenise = createKeywordTokeniser(FalseToken, 'false');
FalseToken.prototype.evaluate = function(scope){
    this.result = false;
};

function DelimiterToken(){}
DelimiterToken = createSpec(DelimiterToken, Token);
DelimiterToken.prototype.name = 'delimiter';
DelimiterToken.prototype.precedence = 2;
DelimiterToken.tokenise = function(substring) {
    var i = 0;
    while(i < substring.length && substring.charAt(i).trim() === "" || substring.charAt(i) === ',') {
        i++;
    }

    if(i){
        return new DelimiterToken(substring.slice(0, i), i);
    }
};
DelimiterToken.prototype.parse = function(tokens, position){
    tokens.splice(position, 1);
};

function IdentifierToken(){}
IdentifierToken = createSpec(IdentifierToken, Token);
IdentifierToken.prototype.name = 'identifier';
IdentifierToken.prototype.precedence = 3;
IdentifierToken.tokenise = function(substring){
    var result = tokeniseIdentifier(substring);

    if(result != null){
        return new IdentifierToken(result, result.length);
    }
};
IdentifierToken.prototype.evaluate = function(scope){
    this.result = scope.get(this.original);
};

function PeriodToken(){}
PeriodToken = createSpec(PeriodToken, Token);
PeriodToken.prototype.name = 'period';
PeriodToken.prototype.precedence = 1;
PeriodToken.tokenise = function(substring){
    var periodConst = ".";
    return (substring.charAt(0) === periodConst) ? new PeriodToken(periodConst, 1) : undefined;
};
PeriodToken.prototype.parse = function(tokens, position){
    this.targetToken = tokens.splice(position-1,1)[0];
    this.identifierToken = tokens.splice(position,1)[0];
};
PeriodToken.prototype.evaluate = function(scope){
    this.targetToken.evaluate(scope);
    if(
        this.targetToken.result &&
        (typeof this.targetToken.result === 'object' || typeof this.targetToken.result === 'function')
        && this.targetToken.result.hasOwnProperty(this.identifierToken.original)
    ){
        this.result = this.targetToken.result[this.identifierToken.original];
    }else{
        this.result = undefined;
    }
};

function FunctionToken(){}
FunctionToken = createSpec(FunctionToken, Token);
FunctionToken.prototype.name = 'function';
FunctionToken.tokenise = function convertFunctionToken(substring) {
    if(substring.charAt(0) === '{' || substring.charAt(0) === '}'){
        return new FunctionToken(substring.charAt(0), 1);
    }
};
FunctionToken.prototype.parse = createNestingParser(/^\{$/,/^\}$/);
FunctionToken.prototype.evaluate = function(scope){
    var parameterNames = this.childTokens.slice(),
        fnBody = parameterNames.pop();
                            
    this.result = function(scope, args){
        scope = new Scope(scope);
            
        for(var i = 0; i < parameterNames.length; i++){
            scope.set(parameterNames[i].original, args.get(i));
        }
        
        fnBody.evaluate(scope);
        
        return fnBody.result;
    }
};

var tokenConverters = [
        StringToken,
        String2Token,
        ParenthesesToken,
        NumberToken,
        NullToken,
        UndefinedToken,
        TrueToken,
        FalseToken,
        DelimiterToken,
        IdentifierToken,
        PeriodToken,
        FunctionToken
    ],
    scope = {
        "toString":function(scope, args){
            return "" + args.next();
        },
        "+":function(scope, args){
            return args.next() + args.next();
        },
        "-":function(scope, args){
            return args.next() - args.next();
        },
        "/":function(scope, args){
            return args.next() / args.next();
        },
        "*":function(scope, args){
            return args.next() * args.next();
        },
        "isNaN":function(scope, args){
            return isNaN(args.get(0));
        },
        "max":function(scope, args){
            var result = args.next();
            while(args.hasNext()){
                result = Math.max(result, args.next());
            }
            return result;
        },
        "min":function(scope, args){
            var result = args.next();
            while(args.hasNext()){
                result = Math.min(result, args.next());
            }
            return result;
        },
        ">":function(scope, args){
            return args.next() > args.next();
        },
        "<":function(scope, args){
            return args.next() < args.next();
        },
        ">=":function(scope, args){
            return args.next() >= args.next();
        },
        "<=":function(scope, args){
            return args.next() <= args.next();
        },
        "?":function(scope, args){
            return args.next() ? args.next() : args.get(2);
        },
        "!":function(scope, args){
            return !args.next();
        },
        "=":function(scope, args){
            return args.next() == args.next();
        },
        "==":function(scope, args){
            return args.next() === args.next();
        },
        "!=":function(scope, args){
            return args.next() != args.next();
        },
        "!==":function(scope, args){
            return args.next() !== args.next();
        },
        "||":function(scope, args){
            var nextArg;
            while(args.hasNext()){
                nextArg = args.next();
                if(nextArg){
                    return nextArg;
                }
            }
            return nextArg;
        },
        "|":function(scope, args){
            var nextArg;
            while(args.hasNext()){
                nextArg = args.next();
                if(nextArg === true ){
                    return nextArg;
                }
            }
            return nextArg;
        },
        "&&":function(scope, args){
            var nextArg;
            while(args.hasNext()){
                nextArg = args.next();
                if(!nextArg){
                    return false;
                }
            }
            return nextArg;
        },
        "object":function(scope, args){
            var result = {};
            while(args.hasNext()){
                result[args.next()] = args.next();
            }
            return result;
        },
        "keys":function(scope, args){
            var object = args.next();
            return typeof object === 'object' ? Object.keys(object) : undefined;
        },
        "values":function(scope, args){
            var target = args.next(),
                result = [];
            for(var key in target){
                result.push(target[key]);
            }
            return result;
        },
        "invert":function(scope, args){
            var target = args.next(),
                result = {};
            for(var key in target){
                result[target[key]] = key;
            }
            return result;
        },
        "extend":function(scope, args){
            var result = {};
            while(args.hasNext()){
                var nextObject = args.next();
                for(var key in nextObject){
                    result[key] = nextObject[key];
                }
            }
            return result;
        },
        "array":function(scope, args){
            var result = [];
            while(args.hasNext()){
                result.push(args.next());
            }
            return result;
        },
        "map":function(scope, args){
            var source = args.next(),
                isArray = Array.isArray(source),
                result = isArray ? [] : {},
                functionToken = args.next();

            if(isArray){
                fastEach(source, function(item, index){
                    result[index] = scope.callWith(functionToken, [item]);
                });
            }else{
                for(var key in source){
                    result[key] = scope.callWith(functionToken, [source[key]]);
                };
            }  
            
            return result;
        },
        "pairs": function(scope, args){
            var target = args.next(),
                result = [];

            for(var key in target){
                if(target.hasOwnProperty(key)){
                    result.push([key, target[key]]);
                }
            }

            return result;
        },
        "flatten":function(scope, args){
            var target = args.next(),
                shallow = args.hasNext() && args.next();

            function flatten(target){
                var result = [],
                    source;

                for(var i = 0; i < target.length; i++){
                    source = target[i];

                    for(var j = 0; j < source.length; j++){
                        if(!shallow && Array.isArray(source[j])){
                            result.push(flatten(source));
                        }else{
                            result.push(target[i][j]);
                        }
                    }
                }
                return result;
            }
            return flatten(target);
        },
        "sort": function(scope, args) {
            var args = args.all(),
                result;
            
            var array = args[0];
            var functionToCompare = args[1];
            
            if (Array.isArray(array)) {
            
                result = array.sort(function(a,b){
                    return scope.callWith(functionToCompare, [a,b]);
                });

                return result;
            
            }else {
                return;
            }
        },
        "filter": function(scope, args) {
            var args = args.all(),
                filteredList = [];
                
            if (args.length < 2) {
                return args;
            }
            


            var array = args[0],
                functionToCompare = args[1];
            
            if (Array.isArray(array)) {
                
                fastEach(array, function(item, index){
                    if(typeof functionToCompare === "function"){
                        if(scope.callWith(functionToCompare, [item])){ 
                            filteredList.push(item);
                        }
                    }else{
                        if(item === functionToCompare){ 
                            filteredList.push(item);
                        }
                    }
                });
                return filteredList;                
            }
        },
        "findOne": function(scope, args) {
            var args = args.all(),
                result;
                
            if (args.length < 2) {
                return args;
            }
            


            var array = args[0],
                functionToCompare = args[1];
            
            if (Array.isArray(array)) {
                
                fastEach(array, function(item, index){
                    if(scope.callWith(functionToCompare, [item])){ 
                        result = item;
                        return true;
                    }
                });
                return result;              
            }
        },
        "concat":function(scope, args){
            var result = args.next();
            while(args.hasNext()){
                if(result == null || !result.concat){
                    return undefined;
                }
                var next = args.next();
                Array.isArray(next) && (result = result.concat(next));
            }
            return result;
        },
        "join":function(scope, args){
            args = args.all();

            return args.slice(1).join(args[0]);
        },
        "slice":function(scope, args){
            var target = args.next(),
                start,
                end;

            if(args.hasNext()){
                start = target;
                target = args.next();
            }
            if(args.hasNext()){
                end = target;
                target = args.next();
            }
            
            return target.slice(start, end);
        },
        "split":function(scope, args){
            return args.next().split(args.hasNext() && args.next());
        },
        "last":function(scope, args){
            var array = args.next();

            if(!Array.isArray(array)){
                return;
            }
            return array.slice(-1).pop();
        },
        "first":function(scope, args){
            var array = args.next();

            if(!Array.isArray(array)){
                return;
            }
            return array[0];
        },
        "length":function(scope, args){
            return args.next().length;
        },
        "getValue":function(scope, args){
            var target = args.next(),
                key = args.next();

            if(!target || typeof target !== 'object'){
                return;
            }

            return target[key];
        },
        "compare":function(scope, args){
            var args = args.all(),
                comparitor = args.pop(),
                reference = args.pop(),
                result = true,
                objectToCompare;
                                
            while(args.length){
                objectToCompare = args.pop();
                for(var key in objectToCompare){
                    if(!scope.callWith(comparitor, [objectToCompare[key], reference[key]])){
                        result = false;
                    }
                }
            }
            
            return result;
        },
        "contains": function(scope, args){
            var args = args.all(),
                target = args.shift(),
                success = false,
                strict = false,
                arg;
                
            if(target == null){
                return;
            }
                
            if(typeof target === 'boolean'){
                strict = target;
                target = args.shift();
            }
                
            arg = args.pop();

            if(target == null || !target.indexOf){
                return;
            }
                                 
            if(typeof arg === "string" && !strict){
                arg = arg.toLowerCase();

                if(Array.isArray(target)){
                    fastEach(target, function(targetItem){
                        if(typeof targetItem === 'string' && targetItem.toLowerCase() === arg.toLowerCase()){
                            return success = true;
                        }
                    });
                }else{
                    if(typeof target === 'string' && target.toLowerCase().indexOf(arg)>=0){
                        return success = true;
                    }
                }
                return success;
            }else{
                return target.indexOf(arg)>=0;
            }
        },
        "charAt":function(scope, args){
            var target = args.next(),
                position;

            if(args.hasNext()){
                position = args.next();
            }

            if(typeof target !== 'string'){
                return;
            }

            return target.charAt(position);
        },
        "toLowerCase":function(scope, args){
            var target = args.next();

            if(typeof target !== 'string'){
                return undefined;
            }

            return target.toLowerCase();
        },
        "toUpperCase":function(scope, args){
            var target = args.next();

            if(typeof target !== 'string'){
                return undefined;
            }

            return target.toUpperCase();
        },
        "format": function format(scope, args) {
            var args = args.all();
            
            return stringFormat(args.shift(), args);
        },
        "refine": function(scope, args){
            var args = args.all(),
                exclude = typeof args[0] === "boolean" && args.shift(),
                original = args.shift(),
                refined = {};
                
            for(var i = 0; i < args.length; i++){
                args[i] = args[i].toString();
            }

            for(var key in original){
                if(args.indexOf(key)>=0){
                    !exclude && (refined[key] = original[key]);
                }else if(exclude){
                    refined[key] = original[key];
                }
            }
            
            return refined;
        },
        "date": (function(){
            var date = function(scope, args) {
                return args.length ? new Date(args.length > 1 ? args.all() : args.next()) : new Date();
            };
            
            date.addDays = function(scope, args){
                var baseDate = args.next();

                return new Date(baseDate.setDate(baseDate.getDate() + args.next()));
            }
            
            return date;
        })(),
        "toJSON":function(scope, args){
            return JSON.stringify(args.next());
        },
        "fromJSON":function(scope, args){
            return JSON.parse(args.next());
        },
        "fold": function(scope, args){
            var args = args.all(),
                fn = args.pop(),
                seed = args.pop(),
                array = args[0],
                result = seed;
            
            if(args.length > 1){
                array = args;
            }

            if(!array || !array.length){
                return result;
            }
                
            for(var i = 0; i < array.length; i++){
                result = scope.callWith(fn, [result, array[i]]);
            }
            
            return result;
        },
        "partial": function(scope, args){
            var outerArgs = args.all(),
                fn = outerArgs.shift();
            
            return function(scope, args){
                var innerArgs = args.all();
                return scope.callWith(fn, outerArgs.concat(innerArgs));
            };
        },
        "flip": function(scope, args){
            var outerArgs = args.all().reverse(),
                fn = outerArgs.pop();
            
            return function(scope, args){
                return scope.callWith(fn, outerArgs)
            };
        },
        "compose": function(scope, args){
            var outerArgs = args.all().reverse();
                
            return function(scope, args){
                var result = scope.callWith(outerArgs[0], args.all());
                
                for(var i = 1; i < outerArgs.length; i++){
                    result = scope.callWith(outerArgs[i], [result]);
                }
                
                return result;
            };
        },
        "apply": function(scope, args){
            var fn = args.next()
                outerArgs = args.next();
                
            return scope.callWith(fn, outerArgs);
        }
    };


Gel = function(){    
    var gel = {},
        lang = new Lang();
        
    gel.lang = lang;
    gel.tokenise = function(expression){
        return gel.lang.tokenise(expression, this.tokenConverters);
    }
    gel.evaluate = function(expression, injectedScope, returnAsTokens){
        var scope = new Lang.Scope();

        scope.add(this.scope).add(injectedScope);

        return lang.evaluate(expression, scope, this.tokenConverters, returnAsTokens);
    };
    gel.tokenConverters = tokenConverters.slice();
    gel.scope = Object.create(scope);
    
    return gel;
};

Gel.Token = Lang.Token;
Gel.Scope = Lang.Scope;

module.exports = Gel;
},{"lang-js":18,"spec-js":20}],18:[function(require,module,exports){
var Token = require('./src/token');

function fastEach(items, callback) {
    for (var i = 0; i < items.length; i++) {
        if (callback(items[i], i, items)) break;
    }
    return items;
}

function callWith(fn, fnArguments, calledToken){
    var argIndex = 0,
        scope = this,
        args = {
            callee: calledToken,
            length: fnArguments.length,
            raw: function(evaluated){
                var rawArgs = fnArguments.slice();
                if(evaluated){
                    fastEach(rawArgs, function(arg){
                        if(arg instanceof Token){
                            arg.evaluate(scope);
                        }
                    });
                }
                return rawArgs;
            },
            getRaw: function(index, evaluated){
                var arg = fnArguments[index];

                if(evaluated){
                    if(arg instanceof Token){
                        arg.evaluate(scope);
                    }
                }
                return arg;
            },
            get: function(index){
                var arg = fnArguments[index];
                    
                if(arg instanceof Token){
                    arg.evaluate(scope);
                    return arg.result;
                }
                return arg;
            },
            hasNext: function(){
                return argIndex < fnArguments.length;
            },
            next: function(){
                if(!this.hasNext()){
                    throw "Incorrect number of arguments";
                }
                if(fnArguments[argIndex] instanceof Token){
                    fnArguments[argIndex].evaluate(scope);
                    return fnArguments[argIndex++].result;
                }
                return fnArguments[argIndex++];
            },
            all: function(){
                var allArgs = [];
                while(this.hasNext()){
                    allArgs.push(this.next());
                }
                return allArgs;
            }
        };
        
    return fn(scope, args);
}

function Scope(oldScope){
    this.__scope__ = {};
    this.__outerScope__ = oldScope;
}
Scope.prototype.get = function(key){
    if(key in this.__scope__){
        if(this.__scope__.hasOwnProperty(key)){
            return this.__scope__[key];
        }
    }
    return this.__outerScope__ && this.__outerScope__.get(key);
};
Scope.prototype.set = function(key, value, bubble){
    if(bubble){
        var currentScope = this;
        while(currentScope && !(key in currentScope.__scope__)){
            currentScope = currentScope.__outerScope__;
        }

        if(currentScope){
            currentScope.set(key, value);
        }
    }
    this.__scope__[key] = value;
    return this;
};
Scope.prototype.add = function(obj){
    for(var key in obj){
        this.__scope__[key] = obj[key];
    }
    return this;
};
Scope.prototype.isDefined = function(key){
    if(key in this.__scope__){
        return true;
    }
    return this.__outerScope__ && this.__outerScope__.isDefined(key) || false;
};
Scope.prototype.callWith = callWith;

// Takes a start and end regex, returns an appropriate parse function
function createNestingParser(openRegex, closeRegex){
    return function(tokens, index){
        if(this.original.match(openRegex)){
            var position = index,
                opens = 1;
                
            while(position++, position <= tokens.length && opens){
                if(!tokens[position]){
                    throw "Invalid nesting. No closing token was found matching " + closeRegex.toString();
                }
                if(tokens[position].original.match(openRegex)){
                    opens++;
                }
                if(tokens[position].original.match(closeRegex)){
                    opens--;
                }
            }

            // remove all wrapped tokens from the token array, including nest end token.
            var childTokens = tokens.splice(index + 1, position - 1 - index);

            // Remove the nest end token.
            childTokens.pop();

            // parse them, then add them as child tokens.
            this.childTokens = parse(childTokens);
            
            //Remove nesting end token
        }else{
            // If a nesting end token is found during parsing,
            // there is invalid nesting,
            // because the opening token should remove its closing token.
            throw "Invalid nesting. No opening token was found matching " + openRegex.toString();
        }
    };
}

function scanForToken(tokenisers, expression){
    for (var i = 0; i < tokenisers.length; i++) {
        var token = tokenisers[i].tokenise(expression);
        if (token) {                
            return token;
        }
    }
}

function sortByPrecedence(items){
    return items.slice().sort(function(a,b){
        var precedenceDifference = a.precedence - b.precedence;
        return precedenceDifference ? precedenceDifference : items.indexOf(a) - items.indexOf(b);
    });
}

function tokenise(expression, tokenConverters, memoisedTokens) {
    if(!expression){
        return [];
    }
    
    if(memoisedTokens && memoisedTokens[expression]){
        return memoisedTokens[expression].slice();
    }

    tokenConverters = sortByPrecedence(tokenConverters);
    
    var originalExpression = expression,
        tokens = [],
        totalCharsProcessed = 0,
        previousLength,
        reservedKeywordToken;
    
    do {
        previousLength = expression.length;
        
        var token;

        token = scanForToken(tokenConverters, expression);
        
        if(token){
            expression = expression.slice(token.length);
            totalCharsProcessed += token.length;                    
            tokens.push(token);
            continue;
        }
        
        if(expression.length === previousLength){
            throw "Unable to determine next token in expression: " + expression;
        }
        
    } while (expression);
    
    memoisedTokens && (memoisedTokens[originalExpression] = tokens.slice());
    
    return tokens;
}

function parse(tokens){
    var parsedTokens = 0,
        tokensByPrecedence = sortByPrecedence(tokens),
        currentToken = tokensByPrecedence[0],
        tokenNumber = 0;

    while(currentToken && currentToken.parsed == true){
        currentToken = tokensByPrecedence[tokenNumber++];
    }

    if(!currentToken){
        return tokens;
    }

    if(currentToken.parse){
        currentToken.parse(tokens, tokens.indexOf(currentToken));
    }

    // Even if the token has no parse method, it is still concidered 'parsed' at this point.
    currentToken.parsed = true;
    
    return parse(tokens);
}

function evaluate(tokens, scope){        
    scope = scope || new Scope();
    for(var i = 0; i < tokens.length; i++){
        var token = tokens[i];
        token.evaluate(scope);
    }
    
    return tokens;
}

function printTopExpressions(stats){
    var allStats = [];
    for(var key in stats){
        allStats.push({
            expression: key,
            time: stats[key].time,
            calls: stats[key].calls,
            averageTime: stats[key].averageTime
        });
    }

    allStats.sort(function(stat1, stat2){
        return stat2.time - stat1.time;
    }).slice(0, 10).forEach(function(stat){
        console.log([
            "Expression: ",
            stat.expression,
            '\n',
            'Average evaluation time: ',
            stat.averageTime,
            '\n',
            'Total time: ',
            stat.time,
            '\n',
            'Call count: ',                    
            stat.calls
        ].join(''));
    });
}

function Lang(){    
    var lang = {},
        memoisedTokens = {},
        memoisedExpressions = {};


    var stats = {};

    lang.printTopExpressions = function(){
        printTopExpressions(stats);
    }

    function addStat(stat){
        var expStats = stats[stat.expression] = stats[stat.expression] || {time:0, calls:0};

        expStats.time += stat.time;
        expStats.calls++;
        expStats.averageTime = expStats.time / expStats.calls;
    }

    lang.parse = parse;
    lang.tokenise = function(expression, tokenConverters){
        return tokenise(expression, tokenConverters, memoisedTokens);
    };
    lang.evaluate = function(expression, scope, tokenConverters, returnAsTokens){
        var langInstance = this,
            memoiseKey = expression,
            expressionTree,
            evaluatedTokens,
            lastToken;

        if(!(scope instanceof Scope)){
            var injectedScope = scope;

            scope = new Scope();

            scope.add(injectedScope);
        }

        if(Array.isArray(expression)){
            return evaluate(expression , scope).slice(-1).pop();
        }

        if(memoisedExpressions[memoiseKey]){
            expressionTree = memoisedExpressions[memoiseKey].slice();
        } else{            
            expressionTree = langInstance.parse(langInstance.tokenise(expression, tokenConverters, memoisedTokens));
            
            memoisedExpressions[memoiseKey] = expressionTree;
        }
        
        
        var startTime = new Date();
        evaluatedTokens = evaluate(expressionTree , scope);
        addStat({
            expression: expression,
            time: new Date() - startTime
        });
        
        if(returnAsTokens){
            return evaluatedTokens.slice();
        }
            
        lastToken = evaluatedTokens.slice(-1).pop();
        
        return lastToken && lastToken.result;
    };
    
    lang.callWith = callWith;
    return lang;
};

Lang.createNestingParser = createNestingParser;
Lang.Scope = Scope;
Lang.Token = Token;

module.exports = Lang;
},{"./src/token":19}],19:[function(require,module,exports){
function Token(substring, length){
    this.original = substring;
    this.length = length;
}
Token.prototype.name = 'token';
Token.prototype.precedence = 0;
Token.prototype.valueOf = function(){
    return this.result;
}

module.exports = Token;
},{}],20:[function(require,module,exports){
Object.create = Object.create || function (o) {
    if (arguments.length > 1) {
        throw new Error('Object.create implementation only accepts the first parameter.');
    }
    function F() {}
    F.prototype = o;
    return new F();
};

function createSpec(child, parent){
    var parentPrototype;
    
    if(!parent) {
        parent = Object;
    }
    
    if(!parent.prototype) {
        parent.prototype = {};
    }
    
    parentPrototype = parent.prototype;
    
    child.prototype = Object.create(parent.prototype);
    child.prototype.__super__ = parentPrototype;
    
    // Yes, This is 'bad'. However, it runs once per Spec creation.
    var spec = new Function("child", "return function " + child.name + "(){child.prototype.__super__.constructor.apply(this, arguments);return child.apply(this, arguments);}")(child);
    
    spec.prototype = child.prototype;
    spec.prototype.constructor = child.prototype.constructor = spec;
    
    return spec;
}

module.exports = createSpec;
},{}],21:[function(require,module,exports){
Object.create = Object.create || function (o) {
    if (arguments.length > 1) {
        throw new Error('Object.create implementation only accepts the first parameter.');
    }
    function F() {}
    F.prototype = o;
    return new F();
};

function createSpec(child, parent){
    var parentPrototype;
    
    if(!parent) {
        parent = Object;
    }
    
    if(!parent.prototype) {
        parent.prototype = {};
    }
    
    parentPrototype = parent.prototype;
    
    child.prototype = Object.create(parent.prototype);
    child.prototype.__super__ = parentPrototype;
    
    // Yes, This is 'bad'. However, it runs once per Spec creation.
    var spec = new Function("child", "return function " + child.name + "(){child.prototype.__super__.constructor.apply(this, arguments);return child.apply(this, arguments);}")(child);
    
    spec.prototype = child.prototype;
    spec.prototype.constructor = child.prototype.constructor = spec;
    
    return spec;
}

module.exports = createSpec;
},{}],22:[function(require,module,exports){
/*
 * raf.js
 * https://github.com/ngryman/raf.js
 *
 * original requestAnimationFrame polyfill by Erik M├Âller
 * inspired from paul_irish gist and post
 *
 * Copyright (c) 2013 ngryman
 * Licensed under the MIT license.
 */

var global = typeof window !== 'undefined' ? window : this;

var lastTime = 0,
    vendors = ['webkit', 'moz'],
    requestAnimationFrame = global.requestAnimationFrame,
    cancelAnimationFrame = global.cancelAnimationFrame,
    i = vendors.length;

// try to un-prefix existing raf
while (--i >= 0 && !requestAnimationFrame) {
    requestAnimationFrame = global[vendors[i] + 'RequestAnimationFrame'];
    cancelAnimationFrame = global[vendors[i] + 'CancelAnimationFrame'];
}

// polyfill with setTimeout fallback
// heavily inspired from @darius gist mod: https://gist.github.com/paulirish/1579671#comment-837945
if (!requestAnimationFrame || !cancelAnimationFrame) {
    requestAnimationFrame = function(callback) {
        var now = +Date.now(),
            nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function() {
            callback(lastTime = nextTime);
        }, nextTime - now);
    };

    cancelAnimationFrame = clearTimeout;
}

if (!cancelAnimationFrame){
    global.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}

global.requestAnimationFrame = requestAnimationFrame;
global.cancelAnimationFrame = cancelAnimationFrame;

module.exports = {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame
};
},{}],23:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "anchor",
	cachedElement;

function Anchor(){
}
Anchor = Gaffa.createSpec(Anchor, Gaffa.ContainerView);
Anchor.prototype.type = viewType;

Anchor.prototype.render = function(){
    var textNode = document.createTextNode(''),
        renderedElement = crel('a',textNode),
        viewModel = this;

    this.views.content.element = renderedElement;
    
    this.renderedElement = renderedElement;

    this.text.textNode = textNode;

    if(!this.external){
        // Prevent default click action reguardless of gaffa.event implementation
        renderedElement.onclick = function(event){event.preventDefault()};

        this.gaffa.events.on('click', renderedElement, function(event){
            viewModel.gaffa.navigate(viewModel.href.value, viewModel.target.value);
        });
    }
    
    this.__super__.render.apply(this, arguments);
};

Anchor.prototype.text = new Gaffa.Property(function(view, value){
    if(value !== null && value !== undefined){
        this.textNode.textContent = value;
    }else{
        this.textNode.textContent = '';
    }
});

Anchor.prototype.target = new Gaffa.Property(function(viewModel, value){
    if(typeof value === 'string'){
        viewModel.renderedElement.setAttribute('target', value);
    }else{
        viewModel.renderedElement.removeAttribute('target');
    }
});

Anchor.prototype.href = new Gaffa.Property(function(viewModel, value){
    if(value !== null && value !== undefined){
        viewModel.renderedElement.setAttribute("href",value);
    }else{
        viewModel.renderedElement.removeAttribute("href");
    }
});

module.exports = Anchor;
},{"crel":12,"gaffa":11}],24:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "button";
    
function Button(){}
Button = Gaffa.createSpec(Button, Gaffa.ContainerView);
Button.prototype.type = viewType;

Button.prototype.render = function(){        
    var textNode = document.createTextNode(''),
        renderedElement = crel('button', textNode);
            
    this.views.content.element = renderedElement;

    this.text.textNode = textNode;
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

Button.prototype.text = new Gaffa.Property(function(view, value){
    if(value !== null && value !== undefined){
        this.textNode.textContent = value;
    }else{
        this.textNode.textContent = '';
    }
});

Button.prototype.subType = new Gaffa.Property(function(viewModel, value){
    viewModel.renderedElement.setAttribute("type", value || 'button');
});

Button.prototype.disabled = new Gaffa.Property(function(viewModel, value){
    if(value){
        viewModel.renderedElement.setAttribute("disabled", "disabled");
    }else{
        viewModel.renderedElement.removeAttribute("disabled");					
    }
});

module.exports = Button;
},{"crel":12,"gaffa":11}],25:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel');

function Checkbox(){}
Checkbox = Gaffa.createSpec(Checkbox, Gaffa.ContainerView);
Checkbox.prototype.type = 'checkbox';

Checkbox.prototype.render = function(){    
    var view = this,
        label,
        checkbox,
        renderedElement = crel('span',
            label = crel('label'),
            checkbox = crel('input', {'type': 'checkbox'})
        );

    this.checkboxInput = checkbox;
    this.checkboxLabel = label;
    
    checkbox.addEventListener(this.updateEventName || "change", function(event){
        view.checked.set(this.checked);            
    });     
    label.addEventListener('click', function(){
        checkbox.click();
    });
    renderedElement.appendChild(checkbox);
    renderedElement.appendChild(label);
	
    this.views.content.element = label;
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

Checkbox.prototype.checked = new Gaffa.Property(function(view, value) {
    view.checkboxInput.checked = value;
});

Checkbox.prototype.text = new Gaffa.Property(function(view, value){
    view.checkboxLabel.textContent = (value && typeof value === 'string') ? value : null;
});

Checkbox.prototype.showLabel = new Gaffa.Property(function(view, value){
    view.checkboxLabel.style.display = value === false ? 'none' : null;
});

module.exports = Checkbox;
},{"crel":12,"gaffa":11}],26:[function(require,module,exports){
var Gaffa = require('gaffa');

function Container(){}
Container = Gaffa.createSpec(Container, Gaffa.ContainerView);
Container.prototype.type = 'container';

Container.prototype.render = function(){    
    this.views.content.element = 
    this.renderedElement = 
    document.createElement(this.tagName || 'div');
    
    this.__super__.render.apply(this, arguments);
};

module.exports = Container;
},{"gaffa":11}],27:[function(require,module,exports){
var Gaffa = require('gaffa'),
    viewType = "form",
    crel = require('crel'),
	cachedElement;

function Form(){}
Form = Gaffa.createSpec(Form, Gaffa.ContainerView);
Form.prototype.type = viewType;

Form.prototype.render = function(){        
    var viewModel = this,
        renderedElement = crel('form')
    
    if (this.action) {
        renderedElement.setAttribute("action", this.action);
    } else {
        renderedElement.addEventListener('submit', function (event) {
            if(viewModel.actions.submit){
                event.preventDefault();
            }
        });
    }

    if (this.method) {
        renderedElement.setAttribute("method", this.method);
    }
    
    this.views.content.element = renderedElement;
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

module.exports = Form;
},{"crel":12,"gaffa":11}],28:[function(require,module,exports){
var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "group";

function Group(){
    this.views.groups = new Gaffa.ViewContainer(this.views.groups);
    this.views.empty = new Gaffa.ViewContainer(this.views.empty);
}
Group = Gaffa.createSpec(Group, Gaffa.ContainerView);
Group.prototype.type = viewType;
Group.prototype.render = function(){
    
    var renderedElement = crel('div');
    
    this.views.groups.element = renderedElement;
    this.views.empty.element = renderedElement;
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
}

function createNewView(property, templateKey, addedItem){
    if(!property.templateCache){
        property.templateCache= {};
    }
    var view = JSON.parse(
        property.templateCache[templateKey] || 
        (property.templateCache[templateKey] = JSON.stringify(property[templateKey]))
    );

    for(var key in addedItem){
        view[key] = addedItem[key];
    }

    return property.gaffa.initialiseViewItem(view, property.gaffa, property.gaffa.views.constructors);
}
       
Group.prototype.groups = new Gaffa.Property({
    update: Gaffa.propertyUpdaters.group(
        "groups",                     
        //increment
        function(viewModel, groups, addedItem){
            var listViews = viewModel.views.groups,
                property = viewModel.groups,
                groupContainer = createNewView(property, 'groupTemplate'),
                expression,
                newHeader,
                newList;

            for(var key in addedItem){
                groupContainer[key] = addedItem[key];
            }

            if(property.listTemplate){
                expression = '({items ' + property.listTemplate.list.binding + '}(filter [] {item (= (' + property.expression + ' item) "' + addedItem.group + '")}))';

                newList = createNewView(property, 'listTemplate', addedItem);

                newList.list.binding = expression;

                groupContainer.views.content.add(newList);
            }

            listViews.add(groupContainer);
        },
        //decrement
        function(viewModel, groups, removedItem){
            removedItem.remove();
        },
        //empty
        function(viewModel, insert){
            var emptyViews = viewModel.views.empty,
                property = viewModel.groups;
                
            if(!property.emptyTemplate){
                return;
            }
            
            if(insert){
                if(!emptyViews.length){
                    emptyViews.add(createNewView(property, 'emptyTemplate'));
                }
            }else{
                while(emptyViews.length){
                    emptyViews[0].remove();
                }
            }
        }
    ),
    trackKeys: true
});

module.exports = Group;
},{"crel":12,"gaffa":11}],29:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "heading";
    
function Heading(){    }
Heading = Gaffa.createSpec(Heading, Gaffa.View);
Heading.prototype.type = viewType;

Heading.prototype.render = function(){        
    var textNode = document.createTextNode(''),
        renderedElement = crel('h' + (parseInt(this.level) || 1),textNode);
    
    this.renderedElement = renderedElement;
    
    this.text.textNode = textNode;
    
    this.__super__.render.apply(this, arguments);
};

Heading.prototype.text = new Gaffa.Property(function(view, value){
    if(value !== null && value !== undefined){
        this.textNode.textContent = value;
    }else{
        this.textNode.textContent = '';
    }
});

module.exports = Heading;
},{"crel":12,"gaffa":11}],30:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "html";
    
function Html(){}
Html = Gaffa.createSpec(Html, Gaffa.View);
Html.prototype.type = viewType;

Html.prototype.render = function(){
    var classes = viewType;
    
    var renderedElement = crel('span');
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

Html.prototype.html = new Gaffa.Property(function(viewModel, value){
    viewModel.renderedElement.innerHTML = (typeof value === 'string' || typeof value === 'number') ? value : null;
});

module.exports = Html;
},{"crel":12,"gaffa":11}],31:[function(require,module,exports){
var Gaffa = require('gaffa'),
    viewType = "image",
    crel = require('crel'),
	cachedElement;
    
function imageToURI(image, callback) {
    var reader = new window.FileReader();
    reader.onload = function(event) {
        callback(event.target.result);
    };
    reader.readAsDataURL(image);
}

function Image(){}
Image = Gaffa.createSpec(Image, Gaffa.View);
Image.prototype.type = viewType;

Image.prototype.render = function(){
    var renderedElement = crel('img');
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

Image.prototype.source = new Gaffa.Property(function (viewModel, value) {
    viewModel.renderedElement[value ? 'setAttribute' : 'removeAttribute']('src', value);
});

Image.prototype.image = new Gaffa.Property(function (viewModel, value) {
    if(!value){
        return;
    }
    if(typeof value === 'string'){
        viewModel.renderedElement.setAttribute("src", value);
    }else{
        imageToURI(value, function(dataURI){
            viewModel.renderedElement.setAttribute("src", dataURI);
        });
    }
});

module.exports = Image;
},{"crel":12,"gaffa":11}],32:[function(require,module,exports){
"use strict";

var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = 'label';
    
function Label(){}
Label = Gaffa.createSpec(Label, Gaffa.View);
Label.prototype.type = viewType;

Label.prototype.render = function(){        
    var textNode = document.createTextNode(''),
        renderedElement = crel(this.tagName || 'label', textNode);
    
    this.renderedElement = renderedElement;

    this.text.textNode = textNode;
    
    this.__super__.render.apply(this, arguments);
};

Label.prototype.text = new Gaffa.Property(function(view, value){
    if(value !== null && value !== undefined){
        this.textNode.textContent = value;
    }else{
        this.textNode.textContent = '';
    }
});

Label.prototype.labelFor = new Gaffa.Property(function (viewModel, value) {
    if (value === null || value === undefined) {
        viewModel.renderedElement.removeAttribute("labelFor");
    } else {
        viewModel.renderedElement.setAttribute("labelFor", value);
    }
});

module.exports = Label;
},{"crel":12,"gaffa":11}],33:[function(require,module,exports){
var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "list",
	cachedElement;
    
function List(){
    this.views.list = new Gaffa.ViewContainer(this.views.list);
    this.views.empty = new Gaffa.ViewContainer(this.views.empty);
}
List = Gaffa.createSpec(List, Gaffa.ContainerView);
List.prototype.type = viewType;

List.prototype.render = function(){
    
    var renderedElement = crel(this.tagName || 'div');
    
    this.views.list.element = renderedElement;
	this.views.empty.element = renderedElement;        
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

function createNewView(property, templateKey, addedItem){
    if(!property.templateCache){
        property.templateCache= {};
    }
    var view = JSON.parse(
        property.templateCache[templateKey] || 
        (property.templateCache[templateKey] = JSON.stringify(property[templateKey]))
    );

    for(var key in addedItem){
        view[key] = addedItem[key];
    }

    return property.gaffa.initialiseViewItem(view, property.gaffa, property.gaffa.views.constructors);
}

List.prototype.list = new Gaffa.Property({
    update: Gaffa.propertyUpdaters.collection(
        "list",                     
        //increment
        function(viewModel, list, addedItem, insertIndex){
            var listViews = viewModel.views.list,
                property = viewModel.list;


            listViews.add(createNewView(property, 'template', addedItem), insertIndex);
        },
        //decrement
        function(viewModel, list, removedItem){
            removedItem.remove();
        },
        //empty
        function(viewModel, insert){
            var emptyViews = viewModel.views.empty,
                property = viewModel.list;
                
            if(!property.emptyTemplate){
                return;
            }
            
            if(insert){
                if(!emptyViews.length){
                    emptyViews.add(createNewView(property, 'emptyTemplate'));
                }
            }else{
                while(emptyViews.length){
                    emptyViews[0].remove();
                }
            }
        }
    ),
    trackKeys: true,
    sameAsPrevious:function () {
        var oldKeys = this.getPreviousHash(),
            value = this.value,
            newKeys = value && (value.__gaffaKeys__ || Object.keys(value));

        this.setPreviousHash(newKeys || value);

        if(newKeys && oldKeys && oldKeys.length){
            if(oldKeys.length !== newKeys.length){
                return;
            }
            for (var i = 0; i < newKeys.length; i++) {
                if(newKeys[i] !== oldKeys[i]){
                    return;
                }
            };
            return true;
        }

        return value === oldKeys;
    }
});

module.exports = List;
},{"crel":12,"gaffa":11}],34:[function(require,module,exports){
var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "text";
    
function Text(){}
Text = Gaffa.createSpec(Text, Gaffa.View);
Text.prototype.type = viewType;

Text.prototype.render = function(){        
    this.renderedElement = document.createTextNode('');
    
    this.__super__.render.apply(this, arguments);
};

Text.prototype.text = new Gaffa.Property(function(viewModel, value){
    viewModel.renderedElement.data = value || '';
});

Text.prototype.visible = new Gaffa.Property(function(viewModel, value){
    viewModel.renderedElement.data = (value === false ? '' : viewModel.text.value || '');
});

Text.prototype.title = undefined;
Text.prototype.enabled = undefined;
Text.prototype.classes = undefined;

module.exports = Text;
},{"crel":12,"gaffa":11}],35:[function(require,module,exports){
var Gaffa = require('gaffa'),
    crel = require('crel'),
    viewType = "textbox",
    fastEach = require('fasteach'),
    doc = require('doc-js'),
	cachedElement;
    
function setValue(event){
    var input = event.target,
        viewModel = input.viewModel;
            
    if (viewModel.subType.value === "number") {
        viewModel.value.set(parseFloat(input.value), false);
    } else {
        viewModel.value.set(input.value, false);
    } 
}

function updateValue(viewModel, value){

    value = value || '';

            
    var element = viewModel.renderedElement,
        caretPosition = 0,
        hasCaret = element === document.activeElement; //this is only necissary because IE10 is a pile of crap (i know what a surprise)

    // Skip if the text hasnt changed
    if(value === element.value){
        return;
    }

    // Inspiration taken from http://stackoverflow.com/questions/2897155/get-caret-position-within-an-text-input-field
    // but WOW is that some horrendous code!
    // hungarian notation in JS, mixing between explicit and implicit braces in an if-else
    // spaces between function and call parenthesies...
    // And you couldn't afford yo type 'Position'?? wtf, was 'ition' that much more that you couldn't type it?!
    // iSel.... WHAT THE FUCK IS THAT? I assumed selection, but FUCK, just type 'selection'!
    // Just wow.
    if(hasCaret){
        if (window.document.selection) {
            var selection = window.document.selection.createRange();
            selection.moveStart('character', -element.value.length);
            caretPosition = selection.text.length;
        }
        else if (element.selectionStart || element.selectionStart == '0'){
            caretPosition = element.selectionStart; 
        }       
    }
    
    element.value = value;                    
    
    if(hasCaret){
        if(element.createTextRange) {
            var range = element.createTextRange();
                
            range.move('character', caretPosition);   
            
            range.select();
        }
        if(element.selectionStart) {
            element.setSelectionRange(caretPosition, caretPosition);
        }
    }        
}

function updateSubType(viewModel, value){
    viewModel.renderedElement.setAttribute('type', value != null ? value : "");
}

function updatePlaceholder(viewModel, value){
    viewModel.renderedElement.setAttribute('placeholder', value != null ? value : "");
}

function updateDisabled(viewModel, value){
    if (value){
        viewModel.renderedElement.setAttribute('disabled', 'disabled');
    }else{
        viewModel.renderedElement.removeAttribute('disabled');
    }
}

function updateRequired(viewModel, value){
    if (value){
        viewModel.renderedElement.setAttribute('required', 'required');
    }else{
        viewModel.renderedElement.removeAttribute('required');
    }
}

function Textbox(){}
Textbox = Gaffa.createSpec(Textbox, Gaffa.View);
Textbox.prototype.type = viewType;

Textbox.prototype.render = function(){
    var renderedElement = crel('input'),
        updateEventNames = (this.updateEventName || "change").split(' ');
            
    this._removeHandlers.push(this.gaffa.events.on(this.updateEventName || "change", renderedElement, setValue));
    
    this.renderedElement = renderedElement;
    
    this.__super__.render.apply(this, arguments);
};

Textbox.prototype.value = new Gaffa.Property(updateValue);

Textbox.prototype.subType = new Gaffa.Property(updateSubType);

Textbox.prototype.placeholder = new Gaffa.Property(updatePlaceholder);

Textbox.prototype.disabled = new Gaffa.Property(updateDisabled);

Textbox.prototype.required = new Gaffa.Property(updateRequired);

module.exports = Textbox;
},{"crel":12,"doc-js":14,"fasteach":15,"gaffa":11}],36:[function(require,module,exports){
module.exports = {
    set : require('gaffa/actions/set'),
    ajax : require('gaffa/actions/ajax'),
    push : require('gaffa/actions/push'),
    remove : require('gaffa/actions/remove'),
    toggle : require('gaffa/actions/toggle'),
    conditional : require('gaffa/actions/conditional'),
    forEach : require('gaffa/actions/forEach'),
    browserStorage : require('gaffa/actions/browserStorage')
};
},{"gaffa/actions/ajax":1,"gaffa/actions/browserStorage":2,"gaffa/actions/conditional":3,"gaffa/actions/forEach":4,"gaffa/actions/push":5,"gaffa/actions/remove":6,"gaffa/actions/set":7,"gaffa/actions/toggle":8}],37:[function(require,module,exports){
var Gaffa = require('gaffa'),
	gaffa = new Gaffa(),
	views = gaffa.views.constructors = require('./views'),
	actions = gaffa.actions.constructors = require('./actions'),
	behaviours = gaffa.behaviours.constructors = require('./behaviours');

function createAddTodoForm(){
	var addForm = new views.form(),
		addTodoTextbox = new views.textbox(),
		addTodoIfNotEmpty = new actions.conditional(),
		addTodo = new actions.push(),
		clearNewTodo = new actions.remove();

	addTodoIfNotEmpty.condition.binding = '[]';
	addTodoIfNotEmpty.actions['true'] = [addTodo, clearNewTodo];

	addForm.path = '[/newTodo]';
	addForm.views.content.add(addTodoTextbox);
	addForm.actions.submit = [addTodoIfNotEmpty];
	addTodoTextbox.classes.value = 'newTodo';
	addTodoTextbox.placeholder.value = 'What needs to be done?';

	addTodoTextbox.value.binding = '[]';

	addTodo.source.binding = '(object "label" [])';
	addTodo.target.binding = '[/todos]';

	clearNewTodo.target.binding = '[]';

	return addForm;
}

function createHeader(){
	var header = new views.container(),
		heading = new views.heading();

	heading.text.value = 'todos';

	header.tagName = 'header';
	header.views.content.add([
		heading,
		createAddTodoForm()
	]);

	return header;
}

function createTodoTemplate(){
	var todo = new views.container(),
		todoView = new views.container(),
		completedCheckbox = new views.checkbox(),
		label = new views.label(),
		enableEditing = new actions.set(),
		removeButton = new views.button(),
		removeTodo = new actions.remove(),
		editTodoForm = new views.form(),
		finishEditing = new actions.set(),
		editTodoTextbox = new views.textbox();

	completedCheckbox.showLabel.value = false;
	completedCheckbox.classes.value = 'toggle';
	completedCheckbox.checked.binding = '[completed]';

	label.text.binding = '[label]';
	label.actions.dblclick = [enableEditing];

	enableEditing.source.value = true;
	enableEditing.target.binding = '[editing]';

	removeButton.classes.value = 'destroy';
	removeButton.actions.click = [removeTodo];

	removeTodo.target.binding = '[]';

	todoView.classes.value = 'view';
	todoView.views.content.add([
		completedCheckbox,
		label,
		removeButton
	]);

	todo.tagName = 'li';
	todo.classes.binding = '(join "" (? [completed] "completed") (? [editing] "editing"))';
	todo.views.content.add([
		todoView,
		editTodoForm
	]);

	editTodoTextbox.classes.value = 'edit';
	editTodoTextbox.value.binding = '[label]';
	editTodoTextbox.actions.blur = [finishEditing];

	finishEditing.source.value = false;
	finishEditing.target.binding = '[editing]';

	editTodoForm.actions.submit = [finishEditing];

	editTodoForm.views.content.add(editTodoTextbox);

	return todo;
}

// returns a list of all todos that match the current filter.
var todosInViewBinding = '(? (= [/filter] "all") [] (? (= [/filter] "completed") (filter [] {todo todo.completed}) (filter [] {todo (! todo.completed)})))';

function createTodoList(){
	var todoList = new views.list();

	todoList.tagName = 'ul';
	todoList.classes.value = 'todoList';
	todoList.path = '[todos]';
	todoList.list.binding = todosInViewBinding;
	todoList.list.template = createTodoTemplate();

	return todoList;
}

function createMainSection(){
	var mainSection = new views.container(),
		toggleAllCheckbox = new views.checkbox(),
		toggleAll = new actions.forEach(),
		toggleTo = new actions.set();

	toggleAll.path = '[/todos]'
	toggleAll.target.binding = todosInViewBinding;
	toggleAll.actions.forEach = [toggleTo];

	toggleTo.source.binding = '[/toggleAll]';
	toggleTo.target.binding = '[completed]';

	toggleAllCheckbox.showLabel.value = false;
	toggleAllCheckbox.checked.binding = '[/toggleAll]';
	toggleAllCheckbox.classes.value = 'toggleAll';
	toggleAllCheckbox.visible.binding = '(&& [/todos] (> (length [/todos]) 0))';
	toggleAllCheckbox.actions.change = [toggleAll];

	mainSection.tagName = 'section';
	mainSection.classes.value = 'main';

	mainSection.views.content.add([
		toggleAllCheckbox,
		createTodoList()
	]);

	return mainSection;
}

function createFooter(){
	var footer = new views.container(),
		todoCount = new views.html(),
		filters = new views.list(),
		filterContainer = new views.container(),
		filter = new views.anchor(),
		activateFilter = new actions.set(),
		clearCompletedButton = new views.button(),
		clearCompleted = new actions.set();

	// This is kinda lame. Haven't spent the time to make it clean yet.
	todoCount.html.binding = '({todosLeft (join "" "<strong>" todosLeft "</strong> item" (? (!= todosLeft 1) "s") " left")} (filter [/todos] {todo (! todo.completed)}).length)';
	todoCount.classes.value = 'todoCount';

	filters.path = '[filters]';
	filters.list.binding = '[]';
	filters.list.template = filterContainer;
	filters.classes.value = 'filters';
	filters.tagName = 'ul';

	// Binding is relative to the item in the list that has been rendered.
	// In this case: filters/{index}/label
	filter.text.binding = '[label]';
	filter.href.binding = '(join "" "#/" [filter])';
	filter.external = true;
	filter.classes.binding = '(? (= [filter] [/filter]) "selected" "")';
	filter.actions.click = [activateFilter];

	filterContainer.views.content.add(filter);
	filterContainer.tagName = 'li';

	// relative to filters/{index}
	activateFilter.source.binding = '[filter]';
	// slash prefixed routes are root references.
	activateFilter.target.binding = '[/filter]';

	clearCompletedButton.path = '[/todos]';
	clearCompletedButton.text.binding = '(join "" "Clear completed (" (filter [] {todo todo.completed}).length ")")';
	clearCompletedButton.classes.value = 'clearCompleted';
	clearCompletedButton.visible.binding = '(!(!(findOne [] {todo todo.completed})))';
	clearCompletedButton.actions.click = [clearCompleted];

	clearCompleted.target.binding = '[]';
	clearCompleted.source.binding = '(filter [] {todo (!todo.completed)})';

	footer.tagName = 'footer';
	footer.views.content.add([todoCount, filters, clearCompletedButton]);
	footer.visible.binding = '(&& [/todos] (> (length [/todos]) 0))';

	return footer;
}

var setTodoFilterViaHash = new actions.set();
setTodoFilterViaHash.source.binding = '({parts (? (> parts.length 1) (last (split (last parts) "/")) "all")}(split windowLocation "#"))';
setTodoFilterViaHash.target.binding = '[/filter]';

function createAppBehaviours(){
	var onLoadBehaviour = new behaviours.pageLoad(),
		retieveLocalTodos = new actions.browserStorage(),
		persistTodosOnChange = new behaviours.modelChange(),
		persistTodos = new actions.browserStorage();

	retieveLocalTodos.source.value = 'todos';
	retieveLocalTodos.method.value = 'get';
	retieveLocalTodos.target.binding = '[/todos]';

	onLoadBehaviour.actions.load = [retieveLocalTodos, setTodoFilterViaHash];

	persistTodos.target.value = 'todos';
	persistTodos.method.value = 'set';
	persistTodos.source.binding = '[/todos]';

	persistTodosOnChange.watch.binding = '[/todos]';
	persistTodosOnChange.actions.change = [persistTodos];

	return [
		onLoadBehaviour,
		persistTodosOnChange
	];
}

function createAppView(){
	gaffa.views.renderTarget = '.todoapp';
	gaffa.views.add([
		createHeader(),
		createMainSection(),
		createFooter()
	]);
}

// Default model
gaffa.model.set({
	filters:[
		{
			label: "All",
			filter: 'all'
		},
		{
			label: "Active",
			filter: 'active'
		},
		{
			label: "Completed",
			filter: 'completed'
		}
	],
	filter: "all"
});

// App behaviours
gaffa.behaviours.add(createAppBehaviours());

// Custom hash change handler
// slightly hacky, as actions are usually never triggered without a parent;
window.onhashchange = function(){
	gaffa.actions.trigger([
		setTodoFilterViaHash
	], {
		gaffa: gaffa
	});
};

// The only thing that needs to happen after window load is view insertion.
window.onload = createAppView;
},{"./actions":36,"./behaviours":38,"./views":39,"gaffa":11}],38:[function(require,module,exports){
module.exports = {
    pageLoad : require('gaffa/behaviours/pageLoad'),
    modelChange : require('gaffa/behaviours/modelChange')
};
},{"gaffa/behaviours/modelChange":9,"gaffa/behaviours/pageLoad":10}],39:[function(require,module,exports){
module.exports = {
    container : require('gaffa/views/container'),
    heading : require('gaffa/views/heading'),
    list : require('gaffa/views/list'),
    group : require('gaffa/views/group'),
    form : require('gaffa/views/form'),
    label : require('gaffa/views/label'),
    text : require('gaffa/views/text'),
    button : require('gaffa/views/button'),
    anchor : require('gaffa/views/anchor'),
    image : require('gaffa/views/image'),
    html : require('gaffa/views/html'),
    textbox : require('gaffa/views/textbox'),
    checkbox : require('gaffa/views/checkbox')
};
},{"gaffa/views/anchor":23,"gaffa/views/button":24,"gaffa/views/checkbox":25,"gaffa/views/container":26,"gaffa/views/form":27,"gaffa/views/group":28,"gaffa/views/heading":29,"gaffa/views/html":30,"gaffa/views/image":31,"gaffa/views/label":32,"gaffa/views/list":33,"gaffa/views/text":34,"gaffa/views/textbox":35}]},{},[37])
;

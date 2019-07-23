module.exports = /*syntax:js*/`
try{Object.defineProperty({},'a',{value:0})}catch(err){(function(){var defineProperty=Object.defineProperty;Object.defineProperty=function(object,property,descriptor){delete descriptor.configurable;delete descriptor.enumerable;delete descriptor.writable;try{return defineProperty(object,property,descriptor)}catch(err){object[property]=descriptor.value}}}())}Object.defineProperties||(Object.defineProperties=function defineProperties(object,descriptors){var property;for(property in descriptors){Object.defineProperty(object,property,descriptors[property])}return object});var lambda=function(l){var fn=l.match(/\((.*)\)\s*=>\s*(.*)/);var p=[];var b="";if(fn.length>0){fn.shift()}if(fn.length>0){b=fn.pop()}if(fn.length>0){p=fn.pop().replace(/^\s*|\s(?=\s)|\s*$|,/g,'').split(' ')}fn=((!/\s*return\s+/.test(b))?"return ":"")+b;p.push(fn);try{return Function.apply({},p)}catch(e){return null}};if(typeof(Array.prototype.where)==='undefined'){Array.prototype.where=function(f){var fn=f;if(typeof f=="string"){if((fn=lambda(fn))===null){throw "Syntax error in lambda string: "+f}}var res=[];var l=this.length;var p=[0,0,res];for(var i=1;i<arguments.length;i+=1){p.push(arguments[i])}for(var j=0;j<l;j+=1){if(typeof this[j]=="undefined"){continue}p[0]=this[j];p[1]=j;if(!!fn.apply(this,p)){res.push(this[j])}}return res}}if(!Array.prototype.forEach){Array.prototype.forEach=function(callback,thisArg){var T,k;if(this===null){throw new TypeError(' this is null or not defined')}var O=Object(this);var len=O.length>>>0;if(typeof callback!=="function"){throw new TypeError(callback+' is not a function')}if(arguments.length>1){T=thisArg}k=0;while(k<len){var kValue;if(k in O){kValue=O[k];callback.call(T,kValue,k,O)}k+=1}}}if(!Array.prototype.filter){Array.prototype.filter=function(fun ){'use strict';if(this===void 0||this===null){throw new TypeError()}var t=Object(this);var len=t.length>>>0;if(typeof fun!=='function'){throw new TypeError()}var res=[];var thisArg=arguments.length>=2?arguments[1]:void 0;for(var i=0;i<len;i+=1){if(i in t){var val=t[i];if(fun.call(thisArg,val,i,t)){res.push(val)}}}return res}}if(!Array.prototype.indexOf){Array.prototype.indexOf=function(searchElement,fromIndex){var k;if(this===null){throw new TypeError('"this" is null or not defined')}var O=Object(this);var len=O.length>>>0;if(len===0){return -1}var n= +fromIndex||0;if(Math.abs(n)===Infinity){n=0}if(n>=len){return -1}k=Math.max(n>=0?n:len-Math.abs(n),0);while(k<len){var kValue;if(k in O&&O[k]===searchElement){return k}k+=1}return -1}}if(typeof(String.prototype.localeCompare)==='undefined'){String.prototype.localeCompare=function(str,locale,options){return((this==str)?0:((this>str)?1:-1))}}
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

/* start of nexrender script */

var nexrender = {
    defaultCompositionName: '/*COMPOSITION*/',
    types: [CompItem, FolderItem, FootageItem, AVLayer, ShapeLayer, TextLayer, CameraLayer, LightLayer, Property, PropertyGroup],
};

nexrender.typesMatch = function (types, layer) {
    return nexrender.types.filter(function (t) {
        return layer instanceof t;
    }).length > 0;
};

nexrender.replaceFootage = function (layer, filepath) {
    if (!layer) { return false; }

    var file = new File(filepath);

    if (!file.exists) {
        throw new Error("nexrender: Trying to create a file replacement for an unknown file: " + filepath);
    }

    var importOptions = new ImportOptions(file);
    //importOptions.importAs = ImportAsType.COMP; // you can do stuff like this at this point for PSDs
    var theImport = app.project.importFile(importOptions);
    layer.replaceSource(theImport, true);

    return true;
};

/* call callback for an every compostion matching specific name */
nexrender.selectCompositionsByName = function(name, callback) {
    /* length might change when calling callbacks */
    var len = app.project.items.length;
    for (var i = 1; i <= len; i++) {
        var item = app.project.items[i];
        if (!(item instanceof CompItem)) continue;

        if (name == "*") {
            callback(item);
            continue;
        }

        if (item.name != name) {
            continue;
        }

        callback(item);
        return;
    }
};

/* call callback for an every layer matching specific name and composition */
nexrender.selectLayersByName = function(compositionName, name, callback, types) {
    var foundOnce = false;

    if (!compositionName) compositionName = nexrender.defaultCompositionName;
    if (!types) types = nexrender.types;

    nexrender.selectCompositionsByName(compositionName, function(comp) {
        for (var j = 1; j <= comp.numLayers; j++) {
            var layer = comp.layer(j);
            if (layer.name != name) continue;

            if (nexrender.typesMatch(types, layer)) {
                callback(layer, name);
                foundOnce = true;
            }
        }
    })

    if (!foundOnce) {
        throw new Error("nexrender: Cound't find any layers by provided name (" + name + ") inside a composition: " + compositionName);
    }
};

/* call callback for an every layer matching specific index and composition */
nexrender.selectLayersByIndex = function(compositionName, index, callback, types) {
    var foundOnce = false;

    if (!compositionName) compositionName = nexrender.defaultCompositionName;
    if (!types) types = nexrender.types;

    nexrender.selectCompositionsByName(compositionName, function(comp) {
        var layer = comp.layer(index)
        if (layer) {
            callback(layer, index);
            foundOnce = true;
        }
    })

    if (!foundOnce) {
        throw new Error("nexrender: Cound't find any layers by provided index (" + index + ") inside a composition: " + compositionName);
    }
};

nexrender.changeValueForKeypath = function (o, keys, val) {
    if (keys.length == 0) {
        return val;
    } else {
        var key = keys[0];
        if ("property" in o && o.property(key)) {
            var prop = o.property(key)
            var pval = prop.value;
            var v = changeValueForKeypath(pval, keys.slice(1), val)
            if ("value" in v) {
                prop.setValue(v.value)  
            } else {
                prop.expression = v.expression
            }
            return { "value": o };
        } else if (key in o) {
            var v = changeValueForKeypath(pval, keys.slice(1), val)
            if ("value" in v) {
                o[key] = v.value;                    
            } else {
                o[key] = eval(v.expression)
            }
            return { "value": o };
        } else {
            throw new Error("nexrender: Can't find a property sequence (${property}) for key: " + key);                
        }
    }
};


/* end of nexrender script */
/* start of custom user script */

/*USERSCRIPT*/

/* end of custom user script */
},{}]},{},[1]);
`

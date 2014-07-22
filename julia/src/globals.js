/**
 * Created by julenka on 7/18/14.
 */



// Useful functions
// TODO: Come up with a better naming scheme for this
var RETURN_TRUE = function() { return true; };

// Makes a shallow copy of the input object.
// Assumption: input is an object of the form {key1: value1, key2: value2,...}
// copies only the immediate properties of an object
var shallowCopy = function(input) {
    var result = {};
    for(var prop in input) {

        result[prop] = input[prop];
    }
    return result;
};

// Makes a deep copy of an input object
var deepCopy = function(o) {
    var origObjs = {};
    var objCache = {};
    var nextObjId = 0;
    var propName = "__clone_prop_" + Math.random();

    recurseClone = function(o) {
        // base case
        switch(typeof(o)) {
            case 'undefined':
            case 'boolean':
            case 'number':
            case 'string':
            case 'function':
                return o;
            case 'object':
                break;
            default:
                console.log("warning: unknown typeof " + typeof(o));
                return o;
        }

        if(o === null)
            return o;
        // if we have already cloned this object previously (e.g. circular reference)
        // then just return the cached version
        if(propName in o)
            return objCache[o[propName]];

        // co stands for 'cloned object'
        var co;
        // get the type of the object
        var baseType = Object.prototype.toString.apply(o); // [object X]
        baseType = baseType.substr(8, baseType.length - 9);

        // more base cases
        switch(baseType) {
            case 'Boolean':
                co = new Boolean(o.valueOf());
                break;
            case 'Number':
                co = new Number(o.valueOf());
                break;
            case 'String':
                co = new String(o.valueOf());
                break;
            case 'Date':
                co = new Date(o.valueOf());
                break;

            case 'RegExp':
                co = new RegExp(o);
                break;

            /* File, Blob, FileList, ImageData */

            case 'Array':
                // for an array, just get an array of the given length
                co = new Array(o.length);
                break;

            default:
                console.log("warning: unknown object type " + baseType);
            /* fall through */
            case 'Object':
                // for a generic object, create its prototype
                co = Object.create(Object.getPrototypeOf(o));
                break;
        }

        // get all the properties of this object, prepare for copying
        var props = Object.getOwnPropertyNames(o);
        // save this object (well,the cloned version) in the cache
        o[propName] = nextObjId++;
        objCache[o[propName]] = co;
        origObjs[o[propName]] = o;

        // copy all values of this property
        for(var i=0; i<props.length; i++) {
            var prop = Object.getOwnPropertyDescriptor(o, props[i]);
            // if this property has a value, update it
            if('value' in prop) {
                prop.value = recurseClone(prop.value);
            }
            // define a property the 'right' way, assigning its descriptor
            // this properly preserves the visibility of the property which is nice.
            Object.defineProperty(co, props[i], prop);
        }

        return co;
    }

    var newObj = recurseClone(o);

    /* cleanup */
    // getOwnPropertyNames returns an array of properties that are found
    // directly upon a given object. corresponds both the enumerable AND non-enumerable
    // properties of the object.
    //
    var props = Object.getOwnPropertyNames(origObjs);
    for(var i=0; i<props.length; i++) {
        // delete the 'nextObjId' identifier of a property in this object
        delete origObjs[props[i]][propName];
    }

    return newObj;
};

var valueOrDefault = function(value, default_value) {
    return typeof(value) === 'undefined' ? default_value : value;
};

/**
 * Determines if two variables are equal (shallow comparison, type conversion)
 * Returns true if equal, false otherwise.
 */
var shallowEquals = function(a, b) {
    var a_keys = Object.keys(a);
    var b_keys = Object.keys(b);
    if(a_keys.length !== b_keys.length) {
        return false;
    }
    var examined = {};
    for(var prop in a) {
        examined[prop] = true;
        if(a[prop] !== b[prop]) {
            return false;
        }
    }
    for(var prop in b) {
        if(!(prop in examined)) {
            return false;
        }
    }
    return true;
};
// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();



// Wraps a call to a method within the context of another.
var bind = function (context, name) {
    return function () {
        return context[name].apply(context, arguments);
    };
};

/**
 * Convenience method that adds a radio button with given attributes to a
 * containing jquery object.
 *
 * container: this is where the radio button gets added (jquery object)
 * attributes: {name, id, checked}
 * description: description of the option (user sees this)
 * onClick: execute when clicked
 */
function juliaDemoAddRadioOption($container, attributes, description, onClick) {
    var option = $("<input/>")
        .attr("type", "radio")
        .attr(attributes)
        .click(onClick);
    var label = $("<label/>")
        .attr("for", attributes.id)
        .html(description);
    $container.append(option, label);
}
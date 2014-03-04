// Contains a collection of utilities that I use commonly
// This module depends on jquery, make sure this is loaded first!

// Check if jquery is loaded. If not, pop up a dialog
if(!jQuery) {
    throw{name:"FatalError", message:"using utils.js, but jQuery is not loaded! Did you forget to load jQuery?"};
}

// Inheritance
// Obtained from "Secrets of the JavaScript Ninja", page 145
(function(){
    var initializing = false,
        superPattern =
            /xyz/.test(function() {xyz;}) ? /\b_super\b/ : /.*/; // determines in functions can be serialized

    Object.subClass = function(properties) {
        var _super = this.prototype;

        // instantiate the super class
        initializing = true;
        var proto = new this();
        initializing = false;

        for(var name in properties) {
            proto[name] =
                typeof properties[name] == "function" && // make sure the property being overriden is a function
                typeof _super[name] == "function" && // make sure that the superclass property is also a function
                superPattern.test(properties[name]) ? // and the function that we are copying calls _super
                (function(name, fn) {
                    return function() {
                        // save ths pointer to the super class
                        var tmp = this._super;

                        // set the new super class to be the superclass's super class
                        this._super = _super[name];

                        // call the super class function. Remember that arguments is a special param
                        var ret = fn.apply(this, arguments);

                        this._super = tmp;

                        return ret;
                    };
                })(name, properties[name]):
                properties[name];
        }

        function Class() {
            // if we are not initializing, that is, setting up the prototype for extension
            // AND the init method is defined (it should always be defined)
            // call the init method
            if(!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        }

        Class.prototype = proto;
        Class.constructor = Class;
        Class.subClass = arguments.callee;

        return Class;
    };
})();

//
// Math
//

// extracts a random sample from list of weighted samples
// samples are in the form:
// { 
//    value_1: weight_1,
//    value_2: weight_2,
// }
// assumes that the weights all sum to 1
Math.weighted_random_sample = function(map) {
    var r = Math.random();
    var sum = 0;
    var last = undefined;
    for(var v in map) {
        last = v;
        sum += map[v];
        if (r < sum) {
            return v;
        }
    }
    return last;
}

Math.roundWithSignificance = function(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
}

Math.randint = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

Math.nrand = function() {
    var x1, x2, rad, y1;
    do {
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad >= 1 || rad === 0);
    var c = this.sqrt(-2 * Math.log(rad) / rad);
    return x1 * c;
};

Math.gaussian = function(mu, sigma, x) {
    return this.exp(- this.pow(mu - x, 2) / this.pow(sigma, 2) / 2) / this.sqrt(2 * this.PI * this.pow(sigma, 2));
};

//
// Array
//


Array.prototype.pop_front = function() {
    var rslt = this.splice(0,1);
    return rslt[0];
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};


// TODO: put this in a prototype somewhere.
function remap(v, i_min, i_max, o_min, o_max) {
    if(v < i_min) v = i_min;
    if (v > i_max) v = i_max;
    return (v - i_min) / (i_max - i_min) * (o_max - o_min) + o_min;
}

// Logging
function Logger(level) {
	this.level = level;
}

LOG_LEVEL_VERBOSE = 4;
LOG_LEVEL_DEBUG = 3;
LOG_LEVEL_INFO = 2;
LOG_LEVEL_ERROR = 1;

Logger.prototype.log = function(level, msg) {
	if (this.level >= level) {
        console.log(msg);
	}
};

Logger.prototype.clear = function() {
    this.log_element.empty();
};
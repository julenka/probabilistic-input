
// Check if jquery is loaded. If not, pop up a dialog
if(typeof jQuery === 'undefined') {
    throw{name:"FatalError", message:"Julia requires jQuery! Did you forget to load jQuery?"};
}


//region Utilities and object extensions

// Inheritance
// Obtained from "Secrets of the JavaScript Ninja", page 145
(function(){
    var initializing = false,
        superPattern =
            /xyz/.test(function() //noinspection BadExpressionStatementJS
            {//noinspection JSHint
                xyz;}) ? /\b_super\b/ : /.*/; // determines in functions can be serialized

    Object.subClass = function(properties) {
        var _super = this.prototype;

        // instantiate the super class
        initializing = true;
        var proto = new this();
        initializing = false;

        for(var name in properties) {
            proto[name] =
                typeof properties[name] === "function" && // make sure the property being overriden is a function
                    typeof _super[name] === "function" && // make sure that the superclass property is also a function
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
        //noinspection JSHint
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
Math.weightedRandomSample = function(map) {
    var r = Math.random();
    var sum = 0;
    var last;
    for(var v in map) {
        last = v;
        sum += map[v];
        if (r < sum) {
            return v;
        }
    }
    return last;
};

Math.roundWithSignificance = function(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
};

Math.randint = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

Math.nrand = function() {
    var x1, x2, rad;
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

Math.remap = function(v, i_min, i_max, o_min, o_max) {
    if(v < i_min) {
        v = i_min;
    }
    if (v > i_max){
        v = i_max;
    }
    return (v - i_min) / (i_max - i_min) * (o_max - o_min) + o_min;
};

/// Generates a random sample from a gaussian distribution
/// centered around 0 standard deviation sigma.
/// Method take from http://www.bearcave.com/misl/misl_tech/wavelets/hurst/random.html.
/// Has been tested independently so I'm fairly sure it works.
Math.sampleFromGaussian = function(sigma) {
    var x1, x2, w, y1;

    do{
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() -1;
        w = x1 * x1 + x2 * x2;
    } while(w >= 1);

    w = this.sqrt(-2 * this.log(w) / w);
    y1 = x1 * w;
    return y1 * sigma;
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

Array.prototype.extend = function(ar2) {
    this.push.apply(this, ar2);
};

Array.prototype.shuffle = function() {
    var currentIndex = this.length - 1,
        temp,
        randomIndex;
    while(currentIndex >= 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        temp = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temp;
        currentIndex--;
    }
};

Function.prototype.curry = function() {
    var fn = this,
        args = Array.prototype.slice.call(arguments);
    return function() {
        return fn.apply(this, args.concat(
            Array.prototype.slice.call(arguments)));
    }; };

//endregion

//region Logging
//noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
var LOG_LEVEL_VERBOSE = 4, LOG_LEVEL_DEBUG = 3, LOG_LEVEL_INFO = 2, LOG_LEVEL_ERROR = 1;
// The current logging level. Modify this to change log level
//noinspection UnnecessaryLocalVariableJS
var gLogLevel = LOG_LEVEL_VERBOSE;

function log(level, msg) {
    if(gLogLevel >= level) {
        //noinspection JSHint
        console.log(msg);
    }
}


//endregion

//region Events

PEventHook.ALL_EVENT_TYPES = ['mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'click', 'keypress'];
function PEventHook(el, fn, event_types) {
    if (typeof event_types === 'undefined') {
        event_types = PEventHook.ALL_EVENT_TYPES;
    }
    this.variance_x_px = 100;
    this.variance_y_px = 100;
    this.event_types = event_types;
    var me = this;
    var dispatchEvent = function(e) {
        var type = e.type;
        if(me.event_types.indexOf(type) === -1) {
            return;
        }
        var pEvent;
        if(type === "click" || type === "mousedown" || type === "mousemove" || type === "mouseup") {
            pEvent = new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px);
        } else {
            pEvent = new PKeyEvent(1, e);
        }
        fn(pEvent);
    };

    if(typeof el === 'undefined') {
        el = window;
    }
    PEventHook.ALL_EVENT_TYPES.forEach(function (type) {
        el.addEventListener(type, dispatchEvent, true);
    });
}

var PEvent = Object.subClass({

    init: function (identity_p, e) {
        // base event is the event that this probabilsitic event was generated from.
        // seems useful, not sure. Maybe it can be either a regular DOM event or
        this.base_event = e;
    },
    getSamples: function () {
        throw({name: "FatalError", message: "PEvent.getSamples is not implemented!"});
    }
});

var PMouseEvent = PEvent.subClass({
    init: function (identity_p, e, sigma_x, sigma_y) {
        this._super(identity_p, e);
        this.sigma_x = sigma_x;
        this.sigma_y = sigma_y;
        this.type = e.type;
        this.source = "mouse";
    },
    getSamples: function (n) {
        var left = 0, top = 0;
        if (this.base_event.currentTarget !== window) {
            //noinspection JSHint
            var offset = $(this.base_event.currentTarget).offset();
            left = offset.left;
            top = offset.top;
        }

        if(isNaN(left)) {
            left = 0 ;
        }
        if(isNaN(top)) {
            top = 0;
        }
        var result = [];
        for (var i = 0; i < n; i++) {
            var sample_x = Math.sampleFromGaussian(this.sigma_x);
            var sample_y = Math.sampleFromGaussian(this.sigma_y);
            result.push(new PMouseEventSample(1 / n, this,
                this.base_event.clientX + sample_x,
                this.base_event.clientY + sample_y,
                this.base_event.clientX + sample_x - left,
                this.base_event.clientY + sample_y - top));
        }
        return result;
    }
});

var PMouseEventSample = PEvent.subClass({
    init: function (identity_p, e, client_x, client_y, element_x, element_y) {
        this._super(identity_p, e);
        this.element_x = element_x;
        this.element_y = element_y;
        this.source = "mouse";
        this.type = e.type;
    }
});

var PKeyEvent = PEvent.subClass({
    init: function(identity_p, e) {
        this._super(identity_p, e);
        this.keyCode = e.keyCode;
        this.source="keyboard";
        this.type = e.type;
    },
    getSamples: function(n) {
        var i;
        var result = [];
        for(i = 0; i < n; i++) {
            result.push(new PKeyEvent(1/n, this.base_event));
        }
        return result;
    }
});

//region endEvent


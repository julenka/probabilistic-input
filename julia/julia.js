
// Check if jquery is loaded. If not, pop up a dialog
if(typeof jQuery === 'undefined') {
    throw{name:"FatalError", message:"Julia requires jQuery! Did you forget to load jQuery?"};
}

//region Utilities and object extensions

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

// Inheritance
// Obtained from "Secrets of the JavaScript Ninja", page 145
(function(){
    var initializing = false,
        superPattern =
            /xyz/.test(function() //noinspection BadExpressionStatementJS
            {//noinspection JSHint,JSUnresolvedVariable
                xyz;}) ? /\b_super\b/ : /.*/; // determines in functions can be serialized

    Object.subClass = function(properties) {
        var _super = this.prototype;

        if (properties.className === undefined) {
            throw "in Object.subClass className is undefined!";
        }

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
                            //noinspection JSUnresolvedVariable
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
                this.className = properties.className;
                this.toString = function() { return this.className; };
            }
        }

        Class.prototype = proto;
        Class.constructor = Class;
        //noinspection JSHint
        Class.subClass = arguments.callee;

        return Class;
    };
})();

// Wraps a call to a method within the context of another.
var bind = function (context, name) {
    return function () {
        return context[name].apply(context, arguments);
    };
};

String.prototype.repeat = function(count) {
    var old = this;
    var result = "";
    for(var i = 0; i < count; i++) {
        result += old;
    }
    return result;
};
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
        //noinspection JSValidateTypes
        return fn.apply(this, args.concat(
            Array.prototype.slice.call(arguments)));
    }; };

/**
 * returns whether this function actually uses the first parameters that are passed to it.
 * A function uses the parameters that are passed to it if the function
 * references the parameter anywhere in the code body
 * If the function contains no params, returns false.
 * for example, this function returns TRUE for the following functions:
 * function(a,b) { return a + b; }
 * function(a) { return a; }
 *
 * And the following function return FALSE:
 * function() { return 0; }
 * function(a,b) { return b; }
 * function(a,b) { return 0; }
 * TODO Make this function work for the first N params
 * TODO Make this function work for all parameters var re2 = /^function\s*\((.*)\)\s*{([\s\S]*)}$/m MATCH
 */
Function.prototype.usesFirstParam = function() {
    // the [\s\S] is because '.' doesn't match whitespace
    // 'm' makes the regex multiline
    // \W matches NON-WORDS
    var regex = /^function\s*\((\w+)[,\)][\s\S]*\W\1\W[\s\S]*}$/m;
    return regex.test(this.toString());
};

//endregion

//region Logging
//noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
var LOG_LEVEL_VERBOSE = 4, LOG_LEVEL_DEBUG = 3, LOG_LEVEL_INFO = 2, LOG_LEVEL_ERROR = 1;
// The current logging level. Modify this to change log level
//noinspection UnnecessaryLocalVariableJS
var gLogLevel = LOG_LEVEL_DEBUG;
var gTraceLog = false;
function log(level, objs) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    if(gLogLevel >= level) {
        //noinspection JSHint
        console.log.apply(console, args);
        if(gTraceLog) {
            console.trace();
        }

    }
}


//endregion

//region Events

//noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols,JSUnusedGlobalSymbols,JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
var PEventSource = Object.subClass({
    className: "PEventSource",
    init: function(){},
    addListener: function() {
        throw "not implemented!";
    },
    removeListener: function() {
        throw "not implemented!";
    }
});

var DOMEventSource = PEventSource.subClass({
    className: "DOMEventSource",
    init: function(el){
        //noinspection JSUnresolvedVariable
        this.el = el === undefined ? window : el;
        this.event_listeners = [];
    },
    removeEventListeners: function() {
        var me = this;
        this.event_listeners.forEach(function(lt) {
            me.el.removeEventListener(lt.type, lt.fn);
        });
    }
});

var PMouseEventHook = DOMEventSource.subClass({
    className: "PMouseEventHook",
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
        this.variance_x_px = 100;
        this.variance_y_px = 100;
    },
    addListener: function(fn) {
        var me = this;
        ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(type) {
            var fn2 = function(e) {
                fn(new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px, type, e.currentTarget));
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});

var PTouchEventHook = DOMEventSource.subClass({
    className: "PTouchEventHook",
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
        this.variance_x_px = 100;
        this.variance_y_px = 100;
        this.conversions = { touchstart: 'mousedown', touchmove: 'mousemove', touchend: 'mouseup', touchcancel: 'mouseup' };
    },
    makeMouseEvent: function(e) {
        // ***NOTE*** If we ever update what we do with PMouseEvents, we will need to update this as well
        var pageX, pageY;
        if(e.targetTouches.length == 0) {
            pageX = 0;
            pageY = 0
        } else {
            pageX = e.targetTouches[0].pageX;
            pageY = e.targetTouches[0].pageY;
        }


        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(this.conversions[e.type], true, true, this.el, 0, pageX, pageY, pageX, pageY,
            false, false, false, false, 0, null);
        return event;
    },
    addListener: function(fn) {
        var me = this;

        // according to http://www.html5rocks.com/en/mobile/touchandmouse/
        // when dealing with svgs, we shoul register a touch down handler, then once this happens, add move handlers,
        // then on touch end remove them
        var touchStartListener = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var event = me.makeMouseEvent(e);

            var moveFn = function(e) {
                var event = me.makeMouseEvent(e);
                fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));
            };
            var endFn = function(e) {
                var event = me.makeMouseEvent(e);
                fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));

                me.el.removeEventListener("touchmove", moveFn);
                me.el.removeEventListener(endFn);
            };
            // add move, end event handlers to this.el
            e.target.addEventListener("touchmove", moveFn);
            e.target.addEventListener("touchend", endFn);
            e.target.addEventListener("touchcancel", endFn);

            fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));
        };
        this.el.addEventListener("touchstart", touchStartListener);
        me.event_listeners.push({type: "touchstart", fn: touchStartListener});
    }
});



var PKeyEventHook = DOMEventSource.subClass({
    className: "PKeyEventHook",
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
    },
    addListener: function(fn) {
        var me = this;
        ['keydown', 'keyup', 'keypress'].forEach(function(type) {
            var fn2 = function(e) {
                fn(new PKeyEvent(1, e));
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});

var PVoiceEventSource = PEventSource.subClass({
    className: "PVoiceEventSource",
    init: function() {
        if (!('webkitSpeechRecognition' in window)) {
            var message = "Web Speech API is not supported by this browser. Upgrade to Chrome version 25 or later";
            log(LOG_LEVEL_ERROR, message);
            window.alert(message);
        } else {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 20;
            var me = this;
            this.recognition.onstart = function() {
                log(LOG_LEVEL_DEBUG, "speech started");
                if(typeof(me.onstart) !== 'undefined') {
                    me.onstart();
                }
            };

            this.recognition.onerror = function(event) {
                log(LOG_LEVEL_DEBUG, "ERROR on speech recognition", event.error);
                if(typeof(me.onerror !== 'undefined')) {
                    me.onerror(event.error);
                }
            };

            this.recognition.onend = function() {
                log(LOG_LEVEL_DEBUG, "speech ended");
                if(typeof(me.onend) !== 'undefined') {
                    me.onend();
                }
            };
            this.event_listeners = [];
            this.recognition.onresult = function(event) {
                me.event_listeners.forEach(function(listener) {
                    listener(new PVoiceEvent(event));
                });
            };
        }
    },
    addListener: function(fn) {
        this.event_listeners.push(fn);
    },
    stop: function() {
        if(typeof(this.recognition) === 'undefined') {
            return;
        }
        this.recognition.stop();
    },
    start: function() {
        if(typeof(this.recognition) === 'undefined') {
            return;
        }
        this.recognition.start();
    }
});

var PEvent = Object.subClass({
    className: "PEvent",
    init: function (identity_p, e) {
        // base event is the event that this probabilsitic event was generated from.
        // seems useful, not sure. Maybe it can be either a regular DOM event or
        this.base_event = e;
        this.identity_p = identity_p;
    },
    getSamples: function () {
        throw "not implemented!";
    }
});

/**
 * Voice event as defined by chrome voice api
 * @type {*}
 */
var PVoiceEvent = PEvent.subClass({
    className: "PVoiceEvent",
    init: function (e) {
        this._super(1, e);
        this.source = "voice";
    },
    getSamples: function () {
        var result = [];
        for(var i = this.base_event.resultIndex; i < this.base_event.results.length; i++) {
            for (var j = 0; j < this.base_event.results[i].length; j++) {
                var alternative = this.base_event.results[i][j];
                result.push(new PVoiceEventSample(alternative.confidence, this, alternative.transcript.trim(), this.base_event.results[i].isFinal));
                log(LOG_LEVEL_DEBUG, alternative.transcript);
            }
        }
        return result;
    }
});

var PVoiceEventSample = PEvent.subClass({
    className: "PVoiceEventSample",
    init: function(identity_p, e, transcript, is_final) {
        this._super(identity_p, e);
        this.transcript = transcript;
        this.source = "voice";
        this.type = is_final ? "final" : "interim";
    }
});

var PMouseEvent = PEvent.subClass({
    className: "PMouseEvent",
    init: function (identity_p, e, sigma_x, sigma_y, type, currentTarget) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.sigma_x = sigma_x;
        this.sigma_y = sigma_y;
        this.type = type;
        if(e.type === "mousedown") {
            PMouseEvent.prototype.button_state = "down";
        } else if (e.type === "mouseup") {
            PMouseEvent.prototype.button_state = undefined;
        }
        this.source = "mouse";

        var left = 0, top = 0;
        //noinspection JSUnresolvedVariable
        if (currentTarget !== window) {
            //noinspection JSHint
            var offset = $(currentTarget).offset();
            left = offset.left;
            top = offset.top;
        }
        if(isNaN(left)) {
            left = 0 ;
        }
        if(isNaN(top)) {
            top = 0;
        }
        this.element_x = e.pageX - left;
        this.element_y = e.pageY - top;
    },
    getSamples: function (n) {
        var result = [];
        var randomValues = this.getRandomValues(n);
        for (var i = 0; i < n; i++) {
            var xy = randomValues[i];
            //noinspection JSUnresolvedVariable
            result.push(new PMouseEventSample(1 / n, this,
                this.base_event.pageX + xy.x,
                this.base_event.pageY + xy.y,
                this.element_x + xy.x,
                this.element_y + xy.y));
        }
        return result;
    },
    hashSigmaXSigmaY: function() {
        return this.sigma_x + ',' + this.sigma_y;
    },
    getRandomValues: function(n) {
        var hash = this.hashSigmaXSigmaY();
        if(! (hash in this.pseudorandom_samples)) {
            this.pseudorandom_samples[hash] = [];
        }
        if((typeof this.button_state) === "undefined") {
            this.pseudorandom_samples[hash] = [];
            for(var i = 0; i < n; i++) {
                this.pseudorandom_samples[hash].push({x: Math.sampleFromGaussian(this.sigma_x), y: Math.sampleFromGaussian(this.sigma_y)});
            }
        } else {
            while(this.pseudorandom_samples[hash].length < n){
                this.pseudorandom_samples[hash].push({x: Math.sampleFromGaussian(this.sigma_x), y: Math.sampleFromGaussian(this.sigma_y)});
            }
        }

        return this.pseudorandom_samples[hash];
    }
});

PMouseEvent.prototype.pseudorandom_samples = {};
var PMouseEventSample = PEvent.subClass({
    className: "PMouseEventSample",
    init: function (identity_p, e, client_x, client_y, element_x, element_y) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.element_x = element_x;
        this.element_y = element_y;
        this.source = "mouse";
        this.type = e.type;
    }
});

var PKeyEvent = PEvent.subClass({
    className: "PKeyEvent",
    init: function(identity_p, e) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.keyCode = e.keyCode;
        this.source="keyboard";
        this.type = e.type;
    },
    getSamples: function() {
        return [new PKeyEvent(1, this.base_event)];
    }
});

//endregion

//region Julia

//noinspection JSUnusedGlobalSymbols
var Julia = Object.subClass({
    className: "Julia",
    init: function() {
        // [{viewRoot, event}, {viewRoot, event}]
        this.dispatchQueue = [];
        this.nSamplesPerEvent = 20;
        this.nAlternativesToKeep = 10;
        // [{view:...,probability:...},...]
        this.alternatives = [];
        this.mediator = new Mediator();
        this.combiner = new ActionRequestCombiner();
        this.eventSources = [];
    },
    //TODO test addEventSource
    addEventSource: function(eventSource) {
        eventSource.addListener(bind(this, "dispatchPEvent"));
        this.eventSources.push(eventSource);
    },

    clearEventSources: function(){
        this.eventSources.forEach(function(es){ es.removeEventListeners()});
    },
    removeEventSource: function(eventSource) {
          eventSource.removeEventListeners();
    },
    /**
     * populate the dispatch queue with interface alternatives and event samples.
     * Cross product of interfaces and events
     * Assumes that dispatchQueue is empty initially
     * @param pEvent the event to initialize the dispatch queue with
     */
    initDispatchQueue: function(pEvent) {
        var i,j;
        var samples = pEvent.getSamples(this.nSamplesPerEvent);
        if(this.dispatchQueue.length !== 0) {
            throw({name: "FatalError", message: "initDispatchQueue dispatchQueue not empty!"});
        }
        for(i = 0; i < samples.length; i++) {
            samples[i].sample_index = i;
            for (j = 0; j < this.alternatives.length; j++) {
                this.addToDispatchQueue(this.alternatives[j], samples[i]);
            }
        }
    },
    addToDispatchQueue: function(viewAndProbability, event) {
        this.dispatchQueue.push({
            viewAndProbability: viewAndProbability,
            eventSample: event
        });
    },
    setRootView: function(view) {
        if(!(view instanceof ContainerView)) {
            throw "root view not instance of ContainerView!";
        }
        this.rootView = view;
        this.rootView.resetDirtyBit();
        this.alternatives = [{view: view, probability: 1}];
    },
    /**
     * Remove given view from list of alternatives
     * @param view
     */
    killAlternative: function(view) {
        for (var i = 0; i < this.alternatives.length; i++) {
            var alternative = this.alternatives[i].view;
            if(alternative === view) {
                this.alternatives = this.alternatives.splice(i, 1);
            }
        }
    },
    dispatchPEvent: function(pEvent) {
        this.initDispatchQueue(pEvent);

        var actionRequests = [];
        while(this.dispatchQueue.length !== 0) {
            var viewAndEvent = this.dispatchQueue.shift();
            var requestsFromView = viewAndEvent.viewAndProbability.view.dispatchEvent(viewAndEvent.eventSample);
            requestsFromView.forEach(function(seq) {
                seq.weight *= viewAndEvent.viewAndProbability.probability * viewAndEvent.eventSample.identity_p;
            });
            actionRequests.extend(requestsFromView);
        }
        actionRequests = this.combiner.combine(actionRequests);
        actionRequests.forEach(function(seq) {
            log(LOG_LEVEL_VERBOSE, pEvent.type, seq.requests[seq.requests.length-1].toString().replace(/\s+/g," "), Math.roundWithSignificance(seq.weight,2));
        });
        var mediationResults = this.mediator.mediate(actionRequests);
        var newAlternatives = this.updateInterfaceAlternatives(mediationResults);
        var combinedAlternatives = this.combineInterfaceAlternatives(newAlternatives);
        var downsampledAlternatives = this.downSampleInterfaceAlternatives(
            combinedAlternatives,
            this.nAlternativesToKeep);
        if(downsampledAlternatives.length > 0) {
            if(downsampledAlternatives.length === 1) {
                // there is only one alternative, set a new root view.
                this.setRootView(downsampledAlternatives[0].view);
            } else {
                this.alternatives = downsampledAlternatives;
            }

        }
        // The mediator automatically resamples the views
        if(typeof this.dispatchCompleted !== "undefined") {
            this.dispatchCompleted(this.alternatives, downsampledAlternatives.length > 0);
        }
    },
    /**
     * For now, at the end of the dispatch loop, we will draw feedback to the given elements
     * TODO: when constructed, we shoudl probably specify the element to draw to
     * @param $el
     */
    drawFeedback: function($el, feedback) {
        return feedback.draw($el);
    },
    /**
     * Updates the interface alternatives given a list of mediation results (from the mediator)
     * Does not aggregate similar interfaces
     * @param mediationResults
     * @return {Array} list of the new alternatives which are a result of executing the action requests
     */
    updateInterfaceAlternatives: function(mediationResults) {
        // Update interface alternatives based on mediation results
        var newAlternatives = [], mediationReply, viewClone;
        var deferred = [];
        var i;
        for(i = 0; i < mediationResults.length; i++) {
            mediationReply = mediationResults[i];

            if(mediationReply.accept) {
                var modifiedViews = [];
                var hasFinalAction = false;
                // for each action request, in order to properly move over the viewContext to the clone,
                // we need to let each view know about all requests that came from it. Then it can appropriately
                // update the viewContext for each request when the view gets cloned.
                mediationReply.actionRequestSequence.requests.forEach(function(request) {
                    var viewContext = request.viewContext;
                    if(viewContext.actionRequests === undefined) {
                        viewContext.actionRequests = [];
                    }
                    viewContext.actionRequests.push(request);
                    modifiedViews.push(viewContext);
                });

                viewClone = mediationReply.actionRequestSequence.rootView.clone();
                viewClone.kill = undefined;
                mediationReply.actionRequestSequence.requests.forEach(function(request){
                    if(!request.reversible) {
                        hasFinalAction = true;
                    }
                    request.fn.call(request.viewContext, request.event, viewClone);
                    // set the viewContext dirty bit
                    request.viewContext._dirty = true;
                });
                if((typeof viewClone.kill) === 'undefined') {
                    newAlternatives.push({view: viewClone, probability: mediationReply.probability});
                }

                // since different action request sequences may be possible for the same view, we need to
                // remove the action request information for each view after we perform the clone and update
                modifiedViews.forEach(function(view){
                    view.actionRequests = undefined;
                });
                // If this action request sequence had a final action, set the new root view, and return
                if(hasFinalAction && (typeof viewClone.kill) === 'undefined') {

                    newAlternatives.slice(0, newAlternatives.length - 1);
                    return newAlternatives;
                }
            } else {
                deferred.push(mediationReply);
            }
            // TODO decide what to do for requests that are not accepted (deferred) For now, do nothing.
        }

        if(deferred.length > 0) {
            var logLevel = LOG_LEVEL_DEBUG;
            window.alert("ambiguous action request! See log output for details");
            log(logLevel, "ambiguous request! Can't decide between " + deferred.length + " requests:");
            deferred.forEach(function(reply, i) {
                log(logLevel, "view " + i + ": ");
                var seq = reply.actionRequestSequence;
                seq.requests[seq.requests.length - 1].viewContext.logDump(logLevel);
            });
        }

        return newAlternatives;
    },
    compareAlternatives: function(a,b) {
        return b.probability - a.probability;
    },

    /**
     * ***This modifies the input array***
     * Combines similar alternative interfaces.
     * Takes as input a list of interface alternatives, and their weights.
     * Combines similar interfaces, and returns a new list containing these reduces interfaces
     * TODO make the combination method modular
     * @param interfaceAlternatives the initial, non-combined list of alternatives
     * @returns {Array} A list of
     */
    combineInterfaceAlternatives: function(interfaceAlternatives) {
        if(interfaceAlternatives.length === 0) {
            return [];
        }
        var combinedAlternatives = [], i;
        combinedAlternatives[0] = interfaceAlternatives.shift();
        while(interfaceAlternatives.length > 0) {
            var alternative = interfaceAlternatives.shift();
            var found = false;
            for(i = 0; i < combinedAlternatives.length && !found; i++) {
                if(alternative.view.equals(combinedAlternatives[i].view)) {
                    combinedAlternatives[i].probability += alternative.probability;
                    found = true;
                }
            }
            if(!found) {
                combinedAlternatives.push(alternative);
            }
        }
        return combinedAlternatives;
    },
    /**
     * ***This method modifies the input newAlternatives array***
     * Given a list of interface alternatives (and their probabilities), downsamples this list to a smaller list
     * of maxAlternatives interface alternatives.
     *
     * This particular algorithm just sorts the alternatives by probability and picks the top maxAlternatives
     * interfaces.
     *
     * TODO make this more modular
     * @param newAlternatives
     * @param n maximum number of alternatives to keep
     * @returns {Array} the downsampled interface alternatives
     */
    downSampleInterfaceAlternatives: function(interfaceAlternatives, n) {
        var sortedAlternatives = interfaceAlternatives.sort(function(a,b) {
            return b.probability - a.probability;
        });
        var result = sortedAlternatives.splice(0, n);
        var sum = 0;
        result.forEach(function(alternative) {
            sum += alternative.probability;
        });
        result.forEach(function(alternative){
            alternative.probability = alternative.probability / sum;
        });
        return result;
    },

    /**
     * Draws all current interface alternatives to the DOM, into Snap objects
     * Assumes that julia.css is included
     * Also assumes that all elements are drawnt to a Snap element
     * This is a utility function
     * TODO: fix this to work with any DOM element, or decide that you're using SVGs
     * @param $el
     * @param snap_width the original width of the snap
     * @param snap_eight the original height of the snap
     * @param snap_scale the amount to scale the snap by
     */
    dumpAlternativesAsSnap: function($el, snap_width, snap_height, snap_scale, on_click) {
        $el.empty();
        var me = this;
        this.alternatives.forEach(function(view_probability, i) {
            var d = $("<div class='float-left'></div>");

            d.append(["<div>","i", i, ":", Math.roundWithSignificance(view_probability.probability, 2), "</div>"].join(" "));
            var s = Snap(snap_width * snap_scale, snap_height * snap_scale);
            var s_dom = s.node;
            s_dom.setAttribute("viewBox", [0, 0, snap_width, snap_height].join(" "));
            d.append(s_dom);
            view_probability.view.draw($(s_dom));
            $el.append(d);
            d.click(function(){
                me.setRootView(view_probability.view);
                if(typeof on_click !== 'undefined') {
                    on_click();
                }
            });
        });
    },

    dumpAlternativesAsText: function($el) {
        $el.empty();
        this.alternatives.forEach(function(view_probability, i){
            var d = $("<div class='float-left'></div>");
            d.append(["<div>","i", i, ":", Math.roundWithSignificance(view_probability.probability, 2), "</div>"].join(" "));
            view_probability.view.domDump(d);
            $el.append(d);
        });
    }

});

//endregion


//region Mediation and Action Combination
/**
 * ActionRequestCombiner is responsible for combining multiple action request sequences, and updating the weights
 * of sequences accordingly
 */
var ActionRequestCombiner = Object.subClass({
    className: "ActionRequestCombiner",
    /**
     * Constructor for combiner class
     */
    init: function(){},

    /**
     * Combine multiple action request sequences, updating weights accordingly.
     * Default implementation returns original action request sequence.
     * @returns {Array} The collection of combind ActionRequestSequence objects
     * @param actionRequestSequences
     */
    combine: function(actionRequestSequences) {
        if(actionRequestSequences.length === 0) {
            return [];
        }
        // compare request. rootView
        // compare the code of every action request, and the .event of each actionrequest
        var result = [actionRequestSequences[0]];
        var i,j;

        for(i = 1; i < actionRequestSequences.length; i++) {
            var found = false;
            for(j = 0; j < result.length && !found; j++) {
                // equivalence
                if(this.sequencesAreEqual(actionRequestSequences[i], result[j])) {
                    result[j].weight += actionRequestSequences[i].weight;
                    found = true;
                }
            }
            if(!found) {
                result.push(actionRequestSequences[i]);
            }
        }
        return result;
    },

    /**
     * Determines whether two action request sequences are equal
     * @param a
     * @param b
     * @return boolean Whether sequences a and b are equal
     */
    sequencesAreEqual: function(a,b) {

        if(a.rootView !== b.rootView) {
            return false;
        }
        if(a.requests.length !== b.requests.length) {
            return false;
        }
        for(var i = 0; i < a.requests.length; i++) {
            var aReq = a.requests[i];
            var bReq = b.requests[i];

            if(!aReq.equals(bReq)) {
                return false;
            }
        }
        return true;

    }
});
var Mediator = Object.subClass({
    className: "Mediator",
    init: function(){},
    /**
     * Mediator takes as input a list of action requests and returns a list of resulting actions to execute
     * By default, all actions are returned and accepted
     * If an action is not accepted, it is deferred for execution later
     * @return Array of mediation replies. Each mediation reply contains a sequence of requests to accept and information
     * @param actionRequestSequences
     * @param nAlternativesToKeep
     */
    mediate: function(actionRequestSequences) {
        if(actionRequestSequences.length === 0) {
            return [];
        }
        if(actionRequestSequences.length === 1) {
            return [new MediationReply(actionRequestSequences[0], true, actionRequestSequences[0].weight)];
        }
        var i;
        var sum = 0;

        actionRequestSequences.forEach(function(seq){
            sum += seq.weight;
        });
        for(i = 0; i < actionRequestSequences.length; i++) {
            actionRequestSequences[i].weight /= sum;
        }

        var finalRequests = [];
        var reversibleRequests = [];
        for(i = 0; i < actionRequestSequences.length; i++) {
            var seq = actionRequestSequences[i];
            seq.weight /= sum;
            if(!(seq.requests[seq.requests.length - 1].reversible)) {
                finalRequests.push(seq);
            } else {
                reversibleRequests.push(seq);
            }
        }
        if(finalRequests.length === 0) {
            return this.mediationReplyFromActionSequences(reversibleRequests);
        }

        var cmp = function(a,b) { return b.weight - a.weight;};
        var finalSorted = finalRequests.sort(cmp);
        var feedbackSorted = reversibleRequests.sort(cmp);
        var mediationThreshold = 0.1;

        // finalRequests.length > 0 here
        var w = finalSorted[0].weight;
        var finalShouldBeAccepted = finalSorted.length === 1 || w - finalSorted[1].weight > mediationThreshold;
        if(finalShouldBeAccepted) {
            return [new MediationReply(finalSorted[0], true, finalSorted[0].weight)];
        } else {
            // add deferred action items
            var result = this.mediationReplyFromActionSequences(feedbackSorted);
            result.push(new MediationReply(finalSorted[0], false, finalSorted[0].weight));
            for(var i = 1; i < finalSorted.length && w - finalSorted[i].weight < mediationThreshold; i++) {
                result.push(new MediationReply(finalSorted[i], false, finalSorted[i].weight));
            }
            return result;
        }
    },
    mediationReplyFromActionSequences: function(sequences) {
        var result = [];
        sequences.forEach(function(s) {
            result.push(new MediationReply(s, true, s.weight));
        });
        return result;
    }
});

var MediationReply = Object.subClass({
    className: "MediationReply",
    /**
     *
     * @param actionRequestSequence
     * @param accept boolean indicating whether to accept. If not, action gets defered
     * @param probability
     */
    init: function(actionRequestSequence, accept, probability) {
        this.actionRequestSequence = actionRequestSequence;
        this.accept = accept;
        this.probability = probability;
    }
});
//endregion

//region ActionRequest

/**
 * Represents a request to execute code as a result of an input event.
 * @param fn function to execute
 * @param viewContext the context in which to execute this method.
 * For views, this should be the a reference to the view itself.
 * The context should be cloneable, since it may need to be cloned.
 * When we need to clone an interface (when accepting a final action request), we
 * will need to go over all action requests in a sequence and set the context to the new,
 * cloned, context before moving forward.
 * @type {*}
 */
var ActionRequest = Object.subClass({
    className: "ActionRequest",
    init: function(fn, viewContext, reversible, handlesEvent, event) {
        this.fn = fn;
        //noinspection JSUnusedGlobalSymbols
        this.reversible = reversible;
        this.viewContext = viewContext;
        //noinspection JSUnusedGlobalSymbols
        this.handlesEvent = handlesEvent;
        this.event = event;
    },
    equals: function(other) {
        if(!(other instanceof ActionRequest)) {
            return false;
        }
        if(other.reversible !== this.reversible) {
            return false;
        }
        // for now, let's say that action requests that do not act on the same
        // view (as in, the exact same object) are not equal
        if(other.viewContext !== this.viewContext) {
            return false;
        }
        // by default, we will just check whether the code of the strings are equal
        // TODO think of a better way
        return other.fn.toString() === this.fn.toString();
    }
});

var FSMActionRequest = ActionRequest.subClass({
    className: "FSMActionRequest",
    init: function(action_fn, viewContext, reversible, handlesEvent, event, destination_state, source_state) {
        var fn2 = function(event, rootView) {
            this.current_state = destination_state;
            action_fn.call(this, event, rootView);
        };
        this.action_fn = action_fn;
        this._super(fn2, viewContext, reversible, handlesEvent, event);
        this.destination_state = destination_state;
        this.source_state = source_state;
    },
    // This is for debugging
    // TODO remove (once done with debugging)
    toString: function() {
        return this.action_fn.toString();
    },
    equals: function(other) {
        if(!(other instanceof FSMActionRequest)) {
            return false;
        }
        if(other.reversible !== this.reversible) {
            return false;
        }
        // for now, let's say that action requests that do not act on the same
        // view (as in, the exact same object) are not equal
        if(other.viewContext !== this.viewContext) {
            return false;
        }
        if(other.source_state !== this.source_state) {
            return false;
        }
        if(other.destination_state !== this.destination_state) {
            return false;
        }
        if(this.fn.toString() !== other.fn.toString()) {
            return false;
        }
        if(this.action_fn.usesFirstParam()) {
            // if the function uses the actual input event, then compare the input events as well
            return(this.event === other.event);
        }
        // otherwise, the function does not use the actual input event, so just assume that the requests are equal
        return true;


    }
});

/**
 * Represents a sequence of action requests to execute as a result of an intput event
 * @param rootView The context in which to execute the action event sequence. Should be the root
 * view of the interface
 * @param requests the list of action requests that make up this sequence.
 */
var ActionRequestSequence = Object.subClass({
    className: "ActionRequestSequence",
    init: function(rootView, requests) {
        this.requests = requests;
        this.className = "ActionRequestSequence";
        this.rootView = rootView;
        this.weight = 1;
    },
    clone: function() {
        var requests = [];
        requests.extend(this.requests);
        return new ActionRequestSequence(this.rootView, requests);
    }
});

//endregion

//region Views

//noinspection JSUnusedGlobalSymbols
/**
 * Represents a component of a user interface (or, potentially, an entire interface).
 * @type {*}
 */
var View = Object.subClass({
    className: "View",
    init: function(julia) {
        this.julia = julia;
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        // TODO make the clone method more generic: 1. Create a new object 2. copy action requests 3. copy all properties
        throw "not implemented!";
    },
    /**
     * If this has any action requests that it points to, make sure to move the action requests to
     * the new clone
     * @param clone the clone to copy these action requests to
     */
    cloneActionRequests: function(clone){
        if(typeof this.actionRequests === 'undefined') {
            return;
        }
        var i;
        for(i = 0; i < this.actionRequests.length; i++) {
            this.actionRequests[i].viewContext = clone;
        }
        // after cloning once, we shouldn't update the actionRequests for this view again.
        this.actionRequests = undefined;
    },
    /**
     * Copy any view-specific properties here
     * @param clone
     */
    cloneProperties: function(clone) {
        throw "not implemented!";
    },
    /**
     * Draws the view
     */
    draw: function() {
        throw "not implemented!";
    },
    /**
     * Return true if this object equals the other object
     */
    equals: function(other) {
        if(this.className !== other.className) {
            return false;
        }
        return true;
    },
    /**
     * Updates attributes using the given map
     * @param map A map of the form {attr:newValue}. Use this to update the properties of the object
     * @return the object, in case we want to chain things
     */
    attr: function(map) {
        for(var prop in map) {
            this[prop] = map[prop];
        }
        return this;
    },
    /**
     * Dispatches an event to itself and potentially any children.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @return
     */
    dispatchEvent: function() {
        throw "not implemented!";
    },

    /**
     * Dump a textual representation of the interactor tree to given element
     * @param $el
     */
    domDump: function($el) {
        $el.empty();
        var renderInteractorTreeHelper = function(view, level) {
            var $result = $("<div class='indent-level-" + level + "'></div>");
            $result.append("<p class='obj-property bold'> " + view.className + "</p>");
            if(view instanceof ContainerView) {
                for (var prop in view) {
                    if(typeof view[prop] === "function" || prop === "_super" || prop === "julia" || prop === "className") {
                        continue;
                    }
                    if (prop !== "children") {
                        $result.append("<p class='obj-property'>" + prop + ": " + view[prop] + "</p>");
                    }
                }
                for (var i = 0; i < view.children.length; i++) {
                    var o = view.children[i];
                    $result.append("<p></p>");
                    $result.append(renderInteractorTreeHelper(o, level + 1));
                }
            } else {
                for (var prop in view) {
                    if(typeof view[prop] === "function"  || prop === "_super" || prop === "julia" || prop === "fsm_description" || prop === "className") {
                        continue;
                    }

                    $result.append("<p class='obj-property'>" + prop + ": " + view[prop] + "</p>")
                }
            }
            return $result;
        };
        $el.append(renderInteractorTreeHelper(this, 0));
    },

    /**
     * Dump the state of this interactor to the console
     * @param log_level
     */
    logDump: function(log_level) {
        var dumpHelper = function(view, level) {
            var result = "";
            if(view instanceof ContainerView) {
                for (var prop in view) {
                    if(typeof view[prop] === "function" || prop == "_super" || prop == "julia") {
                        continue;
                    }
                    if (prop !== "children") {
                        result += "\t".repeat(level) + prop + ":" + view[prop] + "\n";
                    }
                }
                result += "\n\n";
                for (var i = 0; i < view.children.length; i++) {
                    var o = view.children[i];
                    result += "\n" + dumpHelper(o, level + 1);
                }
            } else {
                for (var prop2 in view) {
                    if(typeof view[prop2] === "function"  || prop2 === "_super" || prop2 === "julia") {
                        continue;
                    }
                    result += "\t".repeat(level) + prop2 + ":" + view[prop2] + "\n";
                }
            }
            return result;
        };
        log(log_level, dumpHelper(this, 0));
    }
});

//noinspection JSUnusedGlobalSymbols
/**
 * View that contains several children elements
 * TODO: rather than passing background_color and background_image, we can pass a 'props' variable that sets a wide range of values that govern the display .This can be used for all views.
 * TODO: using this 'props' object will also make it easier to clone, since we can just use 'shallow_copy' to copy everything.
 * @type {*}
 * @param julia The Julia object that owns this interface
 * @param background_color the background color of the view. If undefined, no background is shown
 * @param background_image the background image of the view. If undefined, no background image is shown
 */
var ContainerView = View.subClass({
    className: "ContainerView",
    init: function(julia, background_color, background_image) {
        //noinspection JSUnresolvedFunction
        this._super(julia);
        this.children = [];
        // index of the child that is currently in focus
        this.focus_index = -1;
        this.background_color = background_color;
        this.background_image = background_image;
    },
    resetDirtyBit: function() {
        this.children.forEach(function(child){
            child._dirty = false;
            if(child instanceof ContainerView) {
                child.resetDirtyBit();
            }
        });
    },
    setFocus: function(child) {
        for (var i = 0; i < this.children.length; i++) {
            if (child === this.children[i]) {
                this.focus_index = i;
                return;
            }
        }
    },
    clearFocus: function() {
        this.focus_index = -1;
    },
    addChildView: function(view) {
        view.container = this;
        this.children.push(view);
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        var result = new ContainerView(this.julia);
        this.cloneActionRequests(result);
        result.background_color = this.background_color;
        result.background_image = this.background_image;
        result.children = [];
        this.children.forEach(function(child){
            var clone = child.clone();
            clone.container = this;
            result.addChildView(clone);
        });
        result.focus_index = this.focus_index;
        return result;
    },
    /**
     * Draws the view
     */
    draw: function($el) {
        var i = 0;
        if(typeof(this.background_color) !== 'undefined') {
            $el.css('background-color', this.background_color);
        }
        if(typeof(this.background_image) !== 'undefined') {
            $el.css('background-image', this.background_image);
        }
        for(i; i < this.children.length; i++) {
            this.children[i].draw($el);
        }
    },
    /**
     * Return true if this object equals the other object
     */
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        if((this.background_color !== other.background_color)) {
            return false;
        }
        if((this.background_image !== other.background_image)) {
            return false;
        }
        if(this.children.length !== other.children.length) {
            return false;
        }
        if(this.focus_index !== other.focus_index) {
            return false;
        }
        var i;
        for(i = 0; i < this.children.length; i++) {
            if(!this.children[i].equals(other.children[i])) {
                return false;
            }
        }
        return true;
    },

    /**
     * Dispatches an event to itself and potentially any children.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @return
     */
    dispatchEvent: function(event) {
        var i = this.children.length - 1, child;

        // initialize a list of root views and sequences, initially we are empty
        // sequence needs to have the index of the child we left off at

        // [{actionSequence, childIndex}]

        // set tot true if any child handles this event
        var isEventHandled;
        var childIndex = this.focus_index >= 0 && (event instanceof PKeyEvent || event instanceof PVoiceEvent) ? this.focus_index : this.children.length - 1;
        var dispatchQueue = [{actionSequence: new ActionRequestSequence(this, []), childIndex: childIndex}];
        // init: function(rootView, requests) {
        var result = [];
        while(dispatchQueue.length > 0) {
            isEventHandled = false;
            var cur = dispatchQueue.shift();
            var actionSequence = cur.actionSequence;
            // the number of children that generated responses for this event
            var numChildResponses = 0;
            for(i = cur.childIndex; i >= 0; i--) {
                child = this.children[i];

                // dispatch the event to this child
                // if we get a response, if handled end the sequence
                var childResponses = child.dispatchEvent(event);
                var me = this;
                childResponses.forEach(function(response) {
                    // response can be either an ActionRequest or an ActionRequestSequence
                    // if it is an action request, look to see if it is handled. (handlesEvent)
                    // add the item to the current action request sequence
                    // if it is handled, add this to the list of responses
                    // if it is not handled, add this action request sequence to the current list of items to dispatch
                    // and continue
                    var actionSequence2 = actionSequence.clone();
                    if(response instanceof ActionRequest) {
                        isEventHandled = response.handlesEvent;
                        actionSequence2.requests.push(response);
                    } else if (response instanceof ActionRequestSequence) {
                        actionSequence2.requests.extend(response.requests);
                        isEventHandled = response.requests[response.requests.length - 1].handlesEvent;
                    } else {
                        throw "response not the right type!";
                    }
                    // check if the last item is handled.
                    // if it is handled, add this to the list of responses
                    // if it is not handled, add this action request sequence to the current list of items to dispatch
                    // and continue
                    if(isEventHandled) {
                        result.push(actionSequence2);
                        // special case: if this is a keyboard event, and there is no item in focus, add next item to dispatch cue
                        if((event instanceof PKeyEvent || event instanceof PVoiceEventSample )&& me.focus_index < 0 && i > 0) {
                            dispatchQueue.push({actionSequence: actionSequence, childIndex: i - 1});
                        }
                    } else {
                        // If the focus index is >= 0, an item is in focus, don't add it to the dispatch queue (e.g. add
                        // don't dispatch to the next child).
                        if(i > 0 && (me.focus_index < 0 || !(event instanceof PKeyEvent || event instanceof PVoiceEvent))&& i > 0) {
                            dispatchQueue.push({actionSequence: actionSequence2, childIndex: i - 1});
                        } else if(actionSequence2.requests.length > 0){
                            // if i === 0, then we are at the end of dispatch.
                            // Even if the even wasn't handled, we should add this action event sequence
                            // to the response.
                            result.push(actionSequence2);
                        }
                    }

                });
                // If there was any response, stop dispatching as
                // the next dispatch item will be in the dispatch queue
                if(childResponses.length > 0) {
                    numChildResponses++;
                    break;
                }
            }
            // if no child responded, then we need to add the current action request sequence to the result,
            // assuming the action request sequence length > 0
            if(numChildResponses === 0 && actionSequence.requests.length > 0) {
                result.push(actionSequence);
            }

        }
        return result;

    }
});

var FSMView = View.subClass({
    className: "FSMView",
    init: function(julia) {
        //noinspection JSUnresolvedFunction
        this._super(julia);
        this.fsm_description = {};
        this.current_state = "start";
    },
    /**
     * Copies over the state machine for this view to a clone
     * @param view_clone the clone to copy the fsm to
     */
    copyFsm: function(view_clone) {
        view_clone.current_state = this.current_state;
        var i;
        for (var state in this.fsm_description) {
            var new_state = [];

            for(i = 0; i < this.fsm_description[state].length; i++) {
                var transition = this.fsm_description[state][i];
                var new_transition = {};
                for(var prop in transition) {
                    new_transition[prop] = transition[prop];
                }
                new_state.push(new_transition);
            }
            view_clone.fsm_description[state] = new_state;
        }

    },
    copyProperties: function(clone) {
        throw "copyProperties not implemented!";
    },
    clone: function() {
        var result = new FSMView(this.julia);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        return result;
    },
    draw: function($el) {
        $el.append("base control");
    },

    /**
     * Dispatches an event to the finite state machine, generating a list of action requests, as appropriate.
     * Returns a list of action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @param e
     * @return Array list of action requests. Each action request represents a different action that the control
     * may want to take.
     */
    dispatchEvent: function(e) {
        var me = this;
        var response = [], i, j;
        // response: [ {control: control, handled: false, action: fn, feedback: fn}]
        // for each transition
        var transitions = this.fsm_description[this.current_state], transition;
        for(i = 0; i < transitions.length; i++) {
            transition = transitions[i];

            if(transition.take(e, this)) {
                var options = [{action: transition.final_action, is_reversible: false},
                    {action: transition.feedback_action, is_reversible: true}];
                options.forEach(function(option) {
                    if(option.action !== undefined) {
                        response.push(
                            new FSMActionRequest(
                                option.action,
                                me,
                                option.is_reversible,
                                transition.handles_event,
                                e,
                                transition.to,
                                transition.from
                            ));
                    }
                });
            }
        }
        return response;
    },
    equals: function(other) {
        if(this.className !== other.className) {
            return false;
        }
        return this.current_state === other.current_state && this.className === other.className;

    }
});


//endregion

//region FSM

/**
 * View that is governed by a Finite State Machine
 * @type {*}
 */


var Transition = Object.subClass({
    className: "Transition",
    init: function(to,source,type,predicate,feedback_action,final_action,handles_event) {
        this.to = to;
        this.source = source;
        this.type = type;
        this.predicate = predicate;
        //noinspection JSUnusedGlobalSymbols
        this.feedback_action = feedback_action;
        //noinspection JSUnusedGlobalSymbols
        this.final_action = final_action;
        this.handles_event = handles_event;
    },
    take: function(e, view) {
        return this.source === e.source && this.type === e.type && this.predicate.call(view, e, this);
    }
});

var VoiceTransition = Transition.subClass({
    className: "VoiceTransition",
    init: function(to,type,predicate,feedback_action,final_action,handles_event) {
        this._super(to, "voice", type, predicate, feedback_action, final_action, handles_event);
    }

});

var MouseTransition = Transition.subClass({
    className: "MouseTransition",
    init: function(to, type, predicate, feedback_action, final_action, handles_event) {
        this._super(to, "mouse", type, predicate, feedback_action, final_action, handles_event);
    }
});

var MouseDownTransition = MouseTransition.subClass({
    className: "MouseDownTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        this._super(to, "mousedown", predicate, feedback_action, final_action, handles_event);
    }
});

var MouseMoveTransition = MouseTransition.subClass({
    className: "MouseMoveTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        this._super(to, "mousemove", predicate, feedback_action, final_action, handles_event);
    }
});

var MouseUpTransition = MouseTransition.subClass({
    className: "MouseUpTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        this._super(to, "mouseup", predicate, feedback_action, final_action, handles_event);
    }
});
var KeypressTransition = Transition.subClass({
    className: "KeypressTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        //noinspection JSUnresolvedFunction
        this._super(to, "keyboard", "keypress", predicate, feedback_action, final_action, handles_event);
    }
});

var KeydownTransition = Transition.subClass({
    className: "KeypressTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        //noinspection JSUnresolvedFunction
        this._super(to, "keyboard", "keydown", predicate, feedback_action, final_action, handles_event);
    }
});

//endregion

//region Controls

var Cursor = FSMView.subClass({
    className: "Cursor",
    init: function (julia) {
        this._super(julia);
        this.color = "black";
        this.x = 0;
        this.y = 0;
        this.radius = 10;
        this.opacity = 1.0;
        this.current_state = "start";
        this.drag_sample_index = -1;
        this.handles_event = false;
        var t = function() { return true; };
        // TODO: make it easy to apply common properties
        this.fsm_description = {
            start: [
                new MouseDownTransition(
                    "down",
                    t,
                    this.drag_start,
                    undefined,
                    this.handles_event),
                new MouseMoveTransition(
                    "start",
                    t,
                    this.update_location,
                    undefined,
                    this.handles_event)
            ],
            down: [
                new MouseMoveTransition(
                    "down",
                    this.does_sample_index_match,
                    this.drag_progress,
                    undefined,
                    this.handles_event
                ),
                new MouseUpTransition(
                    "start",
                    this.does_sample_index_match,
                    this.drag_end,
                    undefined,
                    this.handles_event
                )
            ]
        };
    },
    does_sample_index_match: function(e) {
        return e.sample_index === this.drag_sample_index;
    },
    update_location: function(e, rootView){
        this.x = e.element_x;
        this.y = e.element_y;
    },
    drag_start: function(e, rootView) {
        // the index of the event sample that we received when a drag was initiated
        this.drag_sample_index = e.sample_index;
        this.update_location(e);
        this.color = "green";
    },
    drag_progress: function(e, rootView) {
        this.update_location(e);
    },
    drag_end: function(e, rootView) {
        this.update_location(e);
        this.color = "black";
        this.drag_sample_index = -1;
    },
    draw: function ($el) {
        // TODO are we okay with drawing this to a Snap?
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        s.circle(this.x, this.y, this.radius).attr({fill: this.color, opacity: this.opacity});
    },
    clone: function() {
        var result = new Cursor(this.julia);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        this.copyProperties(result);
        return result;
    },
    copyProperties: function(clone) {
        clone.color = this.color;
        clone.x = this.x;
        clone.y = this.y;
        clone.radius = this.radius;
        clone.opacity = this.opacity;
        clone.drag_sample_index = this.drag_sample_index;
        clone.handles_event = this.handles_event;
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.x === other.x && this.y === other.y;
    }
});


var Button = FSMView.subClass({
    className: "Button",
    init: function (julia, x, y, w, h) {
        this._super(julia);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.click_handlers = [];
        this.current_state = "start";
        // TODO: make it easy to apply common properties
        this.fsm_description = {
            start: [
                new MouseDownTransition(
                    "down",
                    this.hit_test,
                    this.on_down,
                    undefined,
                    true)
            ],
            down: [
                new MouseMoveTransition(
                    "start",
                    function(e) { return ! (this.hit_test(e));},
                    this.on_out,
                    undefined,
                    false
                ),
                new MouseMoveTransition(
                    "down",
                    function(e) { return (this.hit_test(e));},
                    this.on_move_in,
                    undefined,
                    false
                ),
                new MouseUpTransition(
                    "start",
                    function() { return true;},
                    this.on_up,
                    // on_click is the 'final action' version of this event, and it does final actions
                    // final actions should be appended with the 'final' keywords
                    this.on_click_final,
                    true
                )
            ]
        };
    },
    hit_test: function(e) {
        var rx = e.element_x - this.x;
        var ry = e.element_y - this.y;
        return (rx > 0 && ry > 0 && rx < this.w && ry < this.h);
    },
    on_out: function(e) {

    },
    on_move_in: function(e) {

    },
    on_down: function(e) {

    },
    on_up: function(e) {

    },
    on_click_final: function(e) {
        var handled = false;
        var i = 0;
        while(i < this.click_handlers.length && !handled) {
            handled = this.click_handlers[i]();
            i++;
        }
    },
    draw: function ($el) {
        var c = this.current_state === "start" ? "white" : "black";
        var c2 = this.current_state === "start" ? "black" : "white";
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        s.rect(this.x, this.y, this.w, this.h).attr({stroke: "black", "stroke-width": 3, fill: c});
        s.text(this.x + this.w / 2, this.y + this.h / 2, this.x + ", " + this.y)
            .attr({stroke:c2, fill: c2, fontFamily: "Helvetica", "text-anchor": "middle", "alignment-baseline": "middle"});
    },
    clone: function() {
        var result = new Button(this.julia, this.x, this.y, this.w, this.h);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        result.click_handlers.extend(this.click_handlers);
        return result;
    },
    addClickHandler: function(fn) {
        this.click_handlers.push(fn);
    },
    removeClickHandler: function(fn) {
        var index = this.click_handlers.indexOf(fn);
        if(index > -1) {
            this.click_handlers.splice(index,1);
        }
    }
});

//endregion


//region Feedback
var RootViewFeedback = Object.subClass({
    className: "RootViewFeedback",
    init: function(julia) {
        this.julia = julia;
    },
    draw: function($el) {
        this.julia.rootView.draw($el);
        return this.julia.rootView;
    }
});

var MostLikelyFeedback = Object.subClass({
    className: "MostLikelyFeedback",
    init: function(julia) {
        this.julia = julia;
    },
    draw: function($el) {
        var result = this.julia.alternatives.length > 0 ? this.julia.alternatives[0].view : this.julia.rootView;
        result.draw($el);
        return result;
    }
});
var SimpleFeedback = Object.subClass({
    className: "OpacityFeedback",
    init: function(julia, feedbackType) {
        this.julia = julia;
        this.feedbackType = feedbackType;
    },
    draw: function($el) {
        // creates a merged UI combining the interface alternatives
        // root: the certain root that we have
        // alternatives: all the alternatives for this item
        var me = this;
        var mergeHelper = function(root, alternatives) {
            if(!(root instanceof ContainerView)) {
                // base case
                var dirty_vps = [];
                for(var i = 0; i < alternatives.length; i++) {
                    var vp = alternatives[i];
                    // TODO remove magic number
                    // Don't render feedback for extremely unlikely things
                    if(vp.view._dirty && vp.probability > 0.01) {
                        dirty_vps.push(vp);
                    }
                }
                if(dirty_vps.length > 0) {
                    var result = new ContainerView();
                    dirty_vps.forEach(function(vp){
                        result.addChildView(new me.feedbackType(me.julia, vp.view, vp.probability));
                    });
                    return result;
                }
                return root;
            }

            // this is a containerview
            // For now, assume container is NOT dirty
            // TODO handle the case when the ContainerView is dirty
            for(var i = 0; i < root.children.length; i++) {
                var child = root.children[i];
                var new_alternatives = [];
                for(var j = 0; j < alternatives.length; j++) {
                    new_alternatives.push({view: alternatives[j].view.children[i],
                        probability: alternatives[j].probability});
                }
                root.children[i] = mergeHelper(child, new_alternatives);
            }
            return root;

        };
        // merge the interface
        var mergedRoot = mergeHelper(this.julia.rootView.clone(), this.julia.alternatives);
        mergedRoot.draw($el);
        return mergedRoot;
    }
});

/**
 * Renders a child view with opacity according to its probability
 * uses Snap library
 * @type {*}
 */
var FeedbackOpacityView = View.subClass({
    className: "FeedbackOpacityView",
    init: function(julia, view, probability) {
        this.view = view;
        this.probability = probability;
    },
    draw: function($el) {

        var s = Snap($el[0]);
        var group = s.group();
        group.attr({opacity: Math.roundWithSignificance(this.probability, 2)});
        this.view.draw($(group.node));
    }
});

/**
 * Renders a child view with opacity 1
 * uses Snap library
 * @type {*}
 */
var FeedbackOpacityView1 = View.subClass({
    className: "FeedbackOpacityView1",
    init: function(julia, view, probability) {
        this.view = view;
        this.probability = probability;
    },
    draw: function($el) {

        var s = Snap($el[0]);
        var group = s.group();
        group.attr({opacity: 1});
        this.view.draw($(group.node));
    }
});

//endregion
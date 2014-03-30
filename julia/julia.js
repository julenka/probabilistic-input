
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

// Wraps a call to a method within the context of another.
var bind = function (context, name) {
    return function () {
        return context[name].apply(context, arguments);
    };
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

var PEventSource = Object.subClass({
    init: function(){},
    addListener: function(pEventListener) {
        throw "not implemented!";
    },
    removeListener: function(pEventListener) {
        throw "not implemented!";
    }
});

var DOMEventSource = PEventSource.subClass({
    init: function(el){
        this.el = el === undefined ? window : el;
    }
});

var PMouseEventHook = DOMEventSource.subClass({
    init: function(el) {
        this._super(el);
        this.variance_x_px = 100;
        this.variance_y_px = 100;
    },
    addListener: function(fn) {
        var me = this;
        ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(type) {
            me.el.addEventListener(type, function(e) {
                fn(new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px));
            });
        });
    }
});

var PKeyEventHook = DOMEventSource.subClass({
    init: function(el) {
        this._super(el);
    },
    addListener: function(fn) {
        var me = this;
        ['keydown', 'keyup', 'keypress'].forEach(function(type) {
            me.el.addEventListener(type, function(e) {
                fn(new PKeyEvent(1, e));
            });
        });
    }
});

var PEvent = Object.subClass({
    init: function (identity_p, e) {
        // base event is the event that this probabilsitic event was generated from.
        // seems useful, not sure. Maybe it can be either a regular DOM event or
        this.base_event = e;
    },
    getSamples: function () {
        throw "not implemented!";
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

//endregion

//region Julia

var Julia = Object.subClass({
    init: function(dom_el_to_hook, rootView) {
        // [{viewRoot, event}, {viewRoot, event}]
        this.dispatchQueue = [];
        this.actionRequests = [];
        this.nSamplesPerEvent = 20;
        this.nAlternativesToKeep = 10;
        this.alternatives = [];

        if(dom_el_to_hook === undefined) {
            log(LOG_LEVEL_DEBUG, "Warning: in Julia() dom_el_to_hook is undefined! ");
            return;
        }
        if(rootView === undefined) {
            log(LOG_LEVEL_DEBUG, "Warning: in Julia() rootView is undefined! ");
            return;
        }
        this.setRootView(rootView);
    },
    //TODO test addEventSource
    addEventSource: function(eventSource) {
        eventSource.addListener(bind(this, "dispatchPEvent"));
    },
    /**
     * populate the dispatch queue with interface alternatives and event samples.
     * Cross product of interfaces and events
     * Assumes that dispatchQueue is empty initially
     * @param pEvent
     */
    initDispatchQueue: function(pEvent) {
        var i,j;
        var samples = pEvent.getSamples(this.nSamplesPerEvent);
        if(this.dispatchQueue.length !== 0) {
            throw({name: "FatalError", message: "initDispatchQueue dispatchQueue not empty!"});
        }
        for(i = 0; i < samples.length; i++) {
            for (j = 0; j < this.alternatives.length; j++) {
                this.addToDispatchQueue(this.alternatives[j], samples[i]);
            }
        }
    },
    addToDispatchQueue: function(view, event) {
        this.dispatchQueue.push({
            alternative: view,
            eventSample: event
        });
    },
    setRootView: function(view) {
        this.rootView = view;
        this.alternatives = [{view: view, probability: 1}];
    },
    /**
     * Remove given view from list of alternatives
     * @param view
     */
    killAlternative: function(view) {

    },
    dispatchPEvent: function(pEvent) {
        // TODO: dispatch the event
        this.initDispatchQueue(pEvent);
        var i;
        if(this.actionRequests.length !== 0) {
            throw({name: "FatalError", message: "actionRequests length is not zero!"});
        }
        for(i = 0; i < this.dispatchQueue.length; i++) {
            var viewAndEvent = this.dispatchQueue[i];
            this.actionRequests.extend(viewAndEvent.alternative.dispatchEvent(viewAndEvent.eventSample));
        }
        // TODO combine requests
        // TODO mediate requests
        // TODO execute requests
        // TODO resample views

        if(typeof this.dispatchCompleted !== "undefined") {
            this.dispatchCompleted([]);
        }
    },

    /**
     * Normalizes the weights of action requests so they sum to 1
     * @param actionRequestSequences
     */
    normalizeActions: function(actionRequestSequences) {

    },

    /**
     * Executes the action request sequences that have been accepted by the mediator
     * updates the interface alternatives accordingly
     * @param actionRequessSequences
     */
    executeActions: function(actionRequestSequences) {
        var i, j;
        for(i = 0; i < actionRequestSequences.length; i++) {
            var actionRequestSequence = actionRequestSequences[i];
            var rootView = actionRequestSequence.rootView;
            var rootViewClone = rootView.clone();
            // view.actionRequest
        }
        // for each action request sequence
        // clone the original interface
        // for every interactor context in the sequence, update the context
        // for each function in the action request sequence
        // execute that method with appropriate context

    }


});

//endregion

//region Mediation
var Mediator = Object.subClass({
    init: function(julia) {
        this.julia = julia;
    },
    /**
     * By default the mediator just takes the first nAlternativesToKeep alternatives
     * and doesn't look at probability
     * @param actionRequests
     * @return action requests to accept, with non normalized weights
     */
    mediate: function(actionRequests) {
        var result = [];
        var i;
        for(i = 0; i < this.julia.nAlternativesToKeep; i++) {
            result.push(actionRequests[i]);
        }
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
    init: function(fn, viewContext, reversible, handlesEvent) {
        this.fn = fn;
        this.className = "ActionRequest";
        this.reversible = reversible;
        this.viewContext = viewContext;
        this.handlesEvent = handlesEvent;
    }
});

/**
 * Represents a sequence of action requests to execute as a result of an intput event
 * @param rootView The context in which to execute the action event sequence. Should be the root
 * view of the interface
 * @param requests the list of action requests that make up this sequence.
 */
var ActionRequestSequence = Object.subClass({
    init: function(rootView, requests) {
        this.requests = requests;
        this.className = "ActionRequestSequence";
        this.rootView = rootView;
        this.weight = 1;
    }
});

//endregion

//region Views

/**
 * Represents a component of a user interface (or, potentially, an entire interface).
 * @type {*}
 */
var View = Object.subClass({
    init: function(julia) {
        this.julia = julia;
        this.className = "View";
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        throw "not implemented!";
    },
    cloneProperties: function() {

    },
    /**
     * If this has any action requests that it points to, make sure to move the action requests to
     * the new clone
     */
    cloneActionRequests: function(clone){
        if(typeof this.actionRequests === 'undefined') {
            return;
        }
        var i;
        for(i = 0; i < this.actionRequests.length; i++) {
            this.actionRequets[i].viewContex = clone;
        }
    },
    /**
     * Draws the view
     * @param $el a jQuery element to draw to
     */
    draw: function($el) {
        throw "not implemented!";
    },
    /**
     * Return true if this object equals the other object
     * @param other
     */
    equals: function(other) {
        throw "not implemented!";
    },
    /**
     * Dispatches an event to itself and potentially any children.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @param event
     * @return
     */
    dispatchEvent: function(event) {
        throw "not implemented!";
    }
});

/**
 * View that contains several children elements
 * @type {*}
 */
var ContainerView = View.subClass({
    init: function(julia) {
        this._super(julia);
        this.className = "ContainerView";
    }
});

/**
 * View that is governed by a Finite State Machine
 * @type {*}
 */
var FSMView = View.subClass({
    init: function(julia) {
        this._super(julia);
        this.className = "FSMView";
        this.fsm_description = {};
        this.current_state = undefined;
    },
    clone_fsm: function(control) {
        control.current_state = this.current_state;
        var i;
        for (var state in this.fsm_description) {
            var new_state = [];

            for(i = 0; i < this.fsm_description[state].length; i++) {
                var transition = this.fsm_description[state][i];
                var new_transition = {
                    to: transition.to,
                    source: transition.source,
                    type: transition.type,
                    action: transition.action,
                    feedback: transition.feedback,
                    predicate: transition.predicate,
                    update: transition.update,
                    handles_event: transition.handles_event
                };
                new_state.push(new_transition);
            }
        }
        control.fsm_description[state] = new_state;
    },
    clone: function() {
        var result = new FSMView(this.julia);
        this.clone_fsm(result);
        this.cloneActionRequests(result);
        return result;
    },
    draw: function($el) {
        $el.append("base control");
    },

    /**
     * Dispatches an event to the finite state machine, generating a list of action requests, as appropriate.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @param event
     * @return
     */
    dispatchEvent: function(e) {
        var response = [], i;
        // response: [ {control: control, handled: false, action: fn, feedback: fn}]
        // for each transition
        var transitions = this.fsm_description[this.current_state], transition;
        for(i = 0; i < transitions.length; i++) {
            transition = transitions[i];
            if(transition.take(e, this)) {
                if(typeof transition.action !== 'undefined') {
                    response.push(new ActionRequest(transition.action, this, false, transition.handles_event));
                }
                if(typeof transition.action !== 'undefined') {
                    response.push(new ActionRequest(transition.feedback, this, true), transition.handles_event);
                }
            }
        }
        return response;
    },
    equals: function(other) {
        if(this.className !== other.className) {
            return false;
        }
        if(this.current_state !== other.current_state) {
            return false;
        }
        return true;
    }
});


//endregion

//region FSM
var Transition = Object.subClass({
    init: function(to,source,type,predicate,feedback_action,final_action,handles_event) {
        this.to = to;
        this.source = source;
        this.type = type;
        this.predicate = predicate;
        this.feedback_action = feedback_action;
        this.final_action = final_action;
        this.handles_event = handles_event;
    },
    take: function(e, view) {
        return this.source === e.source && this.type === e.type && this.predicate.call(view, e);
    }
});

var KeypressTransition = Transition.subClass({
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        this._super(to, "keyboard", "keypress", feedback_action, final_action, handles_event);
    }
});

//endregion
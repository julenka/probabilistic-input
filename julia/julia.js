
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
        //noinspection JSValidateTypes
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
            me.el.addEventListener(type, function(e) {
                fn(new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px));
            });
        });
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
            me.el.addEventListener(type, function(e) {
                fn(new PKeyEvent(1, e));
            });
        });
    }
});

var PEvent = Object.subClass({
    className: "PEvent",
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
    className: "PMouseEvent",
    init: function (identity_p, e, sigma_x, sigma_y) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.sigma_x = sigma_x;
        this.sigma_y = sigma_y;
        this.type = e.type;
        this.source = "mouse";
    },
    getSamples: function (n) {
        var left = 0, top = 0;
        //noinspection JSUnresolvedVariable
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
            //noinspection JSUnresolvedVariable
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

//noinspection JSUnusedGlobalSymbols
var Julia = Object.subClass({
    className: "Julia",
    init: function(rootView) {
        // [{viewRoot, event}, {viewRoot, event}]
        this.dispatchQueue = [];
        this.nSamplesPerEvent = 20;
        this.nAlternativesToKeep = 10;
        this.alternatives = [];
        this.mediator = new Mediator();
        this.combiner = new Combiner();
    },
    //TODO test addEventSource
    addEventSource: function(eventSource) {
        eventSource.addListener(bind(this, "dispatchPEvent"));
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
        this.alternatives = [{view: view, probability: 1}];
    },
    /**
     * Remove given view from list of alternatives
     * @param view
     */
    killAlternative: function(view) {

    },
    dispatchPEvent: function(pEvent) {
        this.initDispatchQueue(pEvent);
        var i;

        var actionRequests = [];
        while(this.dispatchQueue.length !== 0) {
            var viewAndEvent = this.dispatchQueue.shift();
            actionRequests.extend(viewAndEvent.viewAndProbability.view.dispatchEvent(viewAndEvent.eventSample));
        }

        var combinedRequests = this.combiner.combine(actionRequests);
        var mediationResults = this.mediator.mediate(combinedRequests, this.nAlternativesToKeep);

        var newAlternatives = [], mediationReply, viewClone;
        for(i = 0; i < mediationResults.length; i++) {
            mediationReply = mediationResults[i];

            if(mediationReply.accept) {
                var modifiedViews = [];
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
                // TODO require that a container be at the root, and update the rootview accordingly
//                viewClone.rootView = viewClone;
                mediationReply.actionRequestSequence.requests.forEach(function(request){
                    request.fn.call(request.viewContext, request.event);
                });
                newAlternatives.push({view: viewClone, probability: mediationReply.probability});

                // since different action request sequences may be possible for the same view, we need to
                // remove the action request information for each view after we perform the clone and update
                modifiedViews.forEach(function(view){
                    view.actionRequests = undefined;
                });
            }
            // TODO decide what to do for requests that are not accepted (deferred)
        }


        if(newAlternatives.length > 0) {
            this.alternatives = newAlternatives;
        }

        // The mediator automatically resamples the views
        if(typeof this.dispatchCompleted !== "undefined") {
            this.dispatchCompleted(this.alternatives, newAlternatives.length > 0);
        }
    }

});

//endregion

//region Mediation and Action Combination
/**
 * Combiner is responsible for combining multiple action request sequences, and updating the weights
 * of sequences accordingly
 */
var Combiner = Object.subClass({
    className: "Combiner",
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
        return actionRequestSequences;
    }
});
var Mediator = Object.subClass({
    className: "Mediator",
    init: function(){},
    /**
     * Mediator returns normalized probabilities s.t. sum of interfaces is 1
     * By default the mediator just takes the first nAlternativesToKeep alternatives
     * and doesn't look at probability
     * @return Array of mediation replies. Each mediation reply contains a sequence of requests to accept and information
     * @param actionRequestSequences
     * @param nAlternativesToKeep
     */
    mediate: function(actionRequestSequences, nAlternativesToKeep) {
        var result = [];
        var i;
        var sum = 0;
        actionRequestSequences.forEach(function(seq){
            sum += seq.weight;
        });
        for(i = 0; i < Math.min(nAlternativesToKeep, actionRequestSequences.length); i++) {
            result.push(new MediationReply(actionRequestSequences[i], true, actionRequestSequences[i].weight / sum));
        }
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
        this.className = "View";
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
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
    },
    /**
     * Dispatches an event to itself and potentially any children.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @return
     */
    dispatchEvent: function() {
        throw "not implemented!";
    }
});

//noinspection JSUnusedGlobalSymbols
/**
 * View that contains several children elements
 * @type {*}
 */
var ContainerView = View.subClass({
    className: "ContainerView",
    init: function(julia) {
        //noinspection JSUnresolvedFunction
        this._super(julia);
        this.className = "ContainerView";
        this.children = [];
    },
    addChildView: function(view) {
        this.children.push(view);
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        var result = new ContainerView(this.julia);
        this.cloneActionRequests(result);
        result.children = [];
        this.children.forEach(function(child){
            result.addChildView(child.clone());
        });
        return result;
    },
    /**
     * Draws the view
     */
    draw: function($el) {
        var i = 0;
        for(i; i < this.children.length; i++) {
            this.children[i].draw($el);
        }
    },
    /**
     * Return true if this object equals the other object
     */
    equals: function(other) {
        if(!this._super.equals(other)) {
            return false;
        }
        if(this.children.length !== other.children.length) {
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
        var dispatchQueue = [{actionSequence: new ActionRequestSequence(this, []), childIndex: this.children.length - 1}];
        // init: function(rootView, requests) {
        var result = [];
        while(dispatchQueue.length > 0) {
            isEventHandled = false;
            var cur = dispatchQueue.shift();
            var actionSequence = cur.actionSequence;
            for(i = cur.childIndex; i >= 0; i--) {
                child = this.children[i];
                // dispatch the event to this child
                // if we get a response, if handled end the sequence
                var childResponses = child.dispatchEvent(event);
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
                    } else {
                        if(i > 0) {
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
                    break;
                }

            }
        }
        return result;

    }
});

/**
 * View that is governed by a Finite State Machine
 * @type {*}
 */
var FSMView = View.subClass({
    className: "FSMView",
    init: function(julia) {
        //noinspection JSUnresolvedFunction
        this._super(julia);
        this.className = "FSMView";
        this.fsm_description = {};
        this.current_state = undefined;
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
                            new ActionRequest(
                                // we need to nest this in another closure to bind transition properly
                                function(destination_state) {
                                    return function(event){
                                        this.current_state = destination_state;
                                        option.action.call(this, event);
                                    };
                                }(transition.to),
                                me,
                                option.is_reversible,
                                transition.handles_event,
                                e
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
        return this.current_state === other.current_state;

    }
});


//endregion

//region FSM
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
        return this.source === e.source && this.type === e.type && this.predicate.call(view, e);
    }
});

var KeypressTransition = Transition.subClass({
    className: "KeypressTransition",
    init: function(to, predicate, feedback_action, final_action, handles_event) {
        //noinspection JSUnresolvedFunction
        this._super(to, "keyboard", "keypress", predicate, feedback_action, final_action, handles_event);
    }
});

//endregion
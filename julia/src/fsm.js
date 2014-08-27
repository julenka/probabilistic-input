/**
 * Created by julenka on 7/18/14.
 */


var FSMView = View.subClass({
    className: "FSMView",
    /**
     * Base class for a view controlled by a FSM
     * @param julia
     * @param properties
     */
    init: function(julia, properties, defaults) {
        //noinspection JSUnresolvedFunction
        this._super(julia, properties, defaults);
        this.fsm_description = {};
        this.current_state = "start";
    },
    /**
     * Copies over the state machine for this view to a clone
     * @param view_clone the clone to copy the fsm to
     */
    copyFsm: function(view_clone) {
        view_clone.current_state = this.current_state;
        view_clone.fsm_description = deepCopy(this.fsm_description);
    },
    clone: function() {
        var result = this._super();
        this.copyFsm(result);
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
            var transition_probability = transition.take(e, this);
            if(transition_probability > 0) {
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
                                transition.from,
                                i,
                                transition_probability
                            ));
                    }
                });
            }
        }
        if(e.type === "mousedown" && response.length > 0) {
            log(LOG_LEVEL_VERBOSE, this.className + "[" + this.current_state + "] returned ", response);
        }

        return response;
    },
    equals: function(other) {
        return this.current_state === other.current_state && this.className === other.className;

    }
});


var Transition = Object.subClass({
    className: "Transition",
    /**
     * attrs: to (required), source (required), type (required), predicate (required), feedback_action (default: undefined)
     * final_action (default: undefined), handles_event (default: false)
     * @param attrs
     */
    init: function(attrs) {
        if(arguments.length === 7) {
            this.initLegacy.apply(this, arguments)
        } else if (arguments.length === 1 ) {
            var defaults = {
                feedback_action: undefined,
                final_action: undefined,
                handles_event: false
            };
            $.extend(this, defaults);
            $.extend(this, attrs);
        } else {
            throw "Transition init() called with wrong number of parameters";
        }
        this.__julia_transition_id = guid();
    },
    initLegacy: function(to,source,type,predicate,feedback_action,final_action,handles_event) {
        this.to = to;
        this.source = source;
        this.type = type;
        this.predicate = predicate;
        //noinspection JSUnusedGlobalSymbols
        this.feedback_action = feedback_action;
        //noinspection JSUnusedGlobalS  ymbols
        this.final_action = final_action;
        this.handles_event = handles_event;
    },
    /**
     * Backwards compatible transition. If we take the transition return 1, otherwise return 0
     * @param e
     * @param view
     * @returns {number}
     */
    take: function(e, view) {
        return this.source === e.source && this.type === e.type && this.predicate.call(view, e, this) ? 1 : 0;
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

/**
 * init: function(to, predicate, feedback_action, final_action, handles_event)
 * @type {MouseTransition}
 */
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



var TransitionWithProbability = Transition.subClass({
    className: "TransitionWithProbability",
    init: function(to,source,type,probability_function,feedback_action,final_action,handles_event) {
        this._super(to,source,type,probability_function,feedback_action,final_action,handles_event);
    },
    /**
     * Backwards compatible transition. If we take the transition return 1, otherwise return 0
     * @param e
     * @param view
     * @returns {number}
     */
    take: function(e, view) {
        if(!(this.source === e.source && this.type === e.type)) {
            return 0;
        }
        return this.predicate.call(view, e, this);
    }
});

var VoiceTransitionWithProbability = TransitionWithProbability.subClass({
    className: "VoiceTransitionWithProbability",
    init: function(to,type,probability_function,feedback_action,final_action,handles_event) {
        this._super(to, "voice", type, probability_function, feedback_action, final_action, handles_event);
    }

});

var MouseTransitionWithProbability = TransitionWithProbability.subClass({
    className: "MouseTransitionWithProbability",
    init: function(to, type, probability_function, feedback_action, final_action, handles_event) {
        this._super(to, "mouse", type, probability_function, feedback_action, final_action, handles_event);
    }
});

var MouseDownTransitionWithProbability = MouseTransitionWithProbability.subClass({
    className: "MouseDownTransitionWithProbability",
    init: function(to, probability_function, feedback_action, final_action, handles_event) {
        this._super(to, "mousedown", probability_function, feedback_action, final_action, handles_event);
    }
});

var MouseMoveTransitionWithProbability = MouseTransitionWithProbability.subClass({
    className: "MouseMoveTransitionWithProbability",
    init: function(to, probability_function, feedback_action, final_action, handles_event) {
        this._super(to, "mousemove", probability_function, feedback_action, final_action, handles_event);
    }
});

var MouseUpTransitionWithProbability = MouseTransitionWithProbability.subClass({
    className: "MouseUpTransitionWithProbability",
    init: function(to, probability_function, feedback_action, final_action, handles_event) {
        this._super(to, "mouseup", probability_function, feedback_action, final_action, handles_event);
    }
});
var KeypressTransitionWithProbability = TransitionWithProbability.subClass({
    className: "KeypressTransitionWithProbability",
    init: function(to, probability_function, feedback_action, final_action, handles_event) {
        //noinspection JSUnresolvedFunction
        this._super(to, "keyboard", "keypress", probability_function, feedback_action, final_action, handles_event);
    }
});

var KeydownTransitionWithProbability = TransitionWithProbability.subClass({
    className: "KeydownTransitionWithProbability",
    init: function(to, probability_function, feedback_action, final_action, handles_event) {
        //noinspection JSUnresolvedFunction
        this._super(to, "keyboard", "keydown", probability_function, feedback_action, final_action, handles_event);
    }
});

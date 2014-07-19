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
                                transition.from,
                                i
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

/**
 * Created by julenka on 8/15/14.
 */

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
    init: function(fn, viewContext, reversible, handlesEvent, event, weight) {
        this.fn = fn;
        //noinspection JSUnusedGlobalSymbols
        this.reversible = reversible;
        this.viewContext = viewContext;
        //noinspection JSUnusedGlobalSymbols
        this.handlesEvent = handlesEvent;
        this.event = event;
        this.weight = weight || 1;
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
    init: function(action_fn, viewContext, reversible, handlesEvent, event, destination_state, source_state,
                   transition_index, weight) {
        var fn2 = function(event, rootView) {
            this.current_state = destination_state;
            action_fn.call(this, event, rootView);
        };
        this.action_fn = action_fn;
        this._super(fn2, viewContext, reversible, handlesEvent, event);
        this.destination_state = destination_state;
        this.source_state = source_state;
        this.transition_index = transition_index;
        this.weight = weight || 1;
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
        if(other.transition_index !== this.transition_index) {
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
    init: function(rootView, requests, weight) {
        this.requests = requests;
        this.className = "ActionRequestSequence";
        this.rootView = rootView;
        this.weight = weight || 1;
    },
    clone: function() {
        var requests = [];
        requests.extend(this.requests);
        return new ActionRequestSequence(this.rootView, requests);
    },
    addActionRequest: function(actionRequest) {
        this.requests.push(actionRequest);
        this.weight *= actionRequest.weight;
    },
    addActionRequestSequence: function(seq) {
        this.requests.extend(seq.requests);
        this.weight *= seq.weight;
    },
    /**
     * Return whether this action request sequence handles an event
     */
    handlesEvent: function() {
        return this.requests[this.requests.length - 1].handlesEvent;
    }
});

/**
 * Action request used for snapping lines, etc.
 * @type {*}
 */
var SnapPointActionRequest = ActionRequest.subClass({
    className: "SnapPointActionRequest",
    equals: function(other) {
        return false;
    }
});
/**
 * Created by julenka on 7/18/14.
 */

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
    init: function(julia, properties) {
        //noinspection JSUnresolvedFunction
        this._super(julia, properties, {"background_color": undefined, "background_image": undefined});
        this.children = [];
        // index of the child that is currently in focus
        this.focus_index = -1;
        this.id_to_child = {};
    },
    resetDirtyBit: function() {
        this._dirty = false;
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
        this.id_to_child[view.__julia_id] = view;
    },
    findViewById: function(id) {
        if(this.__julia_id === id) { return this;}
        if(id in this.id_to_child) {
            return this.id_to_child[id];
        }
        for(var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            if(!(child instanceof ContainerView)) {
                continue;
            }
            var result = child.findViewById(id);
            if(typeof(result) !== 'undefined') {
                return result;
            }
        }
        return undefined;
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        var result = this._super();
        result.children = [];
        this.children.forEach(function(child){
            var clone = child.clone();
            clone.container = this;
            result.addChildView(clone);
            result.id_to_child[child.__julia_id] = clone;
        });
        result.focus_index = this.focus_index;
        return result;
    },
    /**
     * Draws the view
     */
    draw: function($el) {
        var i = 0;
        if(typeof(this.properties.background_color) !== 'undefined') {
            $el.css('background-color', this.properties.background_color);
        }
        if(typeof(this.properties.background_image) !== 'undefined') {
            $el.css('background-image', this.properties.background_image);
        }
        console.log("draw, children length is ", this.children.length);
        for(i; i < this.children.length; i++) {
            this.children[i].draw($el);
        }
    },
    drawAmbiguous: function($el) {
        var i = 0;
        if(typeof(this.properties.background_color) !== 'undefined') {
            $el.css('background-color', this.properties.background_color);
        }
        if(typeof(this.properties.background_image) !== 'undefined') {
            $el.css('background-image', this.properties.background_image);
        }
        for(i; i < this.children.length; i++) {
            if(this.children[i].drawAmbiguous) {
                this.children[i].drawAmbiguous($el);
            } else {
                this.children[i].draw($el);
            }

        }
    },
    /**
     * Return true if this object equals the other object
     */
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        if(!shallowEquals(this.properties, other.properties)) {
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
     * Set up the initial dispatch queue. The dispatch queue contains pairs of
     * ActionRequestSequence, childIndex corresponding to a child and the accumulated actionrequest sequence
     * that results of dispatching to this child should be appended to.
     * @param event
     * @returns {*[]}
     */
    initDispatchQueue: function(event) {
        var childIndex = this.focus_index >= 0 && (event instanceof PKeyEvent || event instanceof PVoiceEvent) ? this.focus_index : this.children.length - 1;
        return [{actionSequence: new ActionRequestSequence(this, []), childIndex: childIndex}];
    },

    dispatchEvent: function(event) {
        var i = this.children.length - 1, child;

        // initialize a list of root views and sequences, initially we are empty
        // sequence needs to have the index of the child we left off at

        // [{actionSequence, childIndex}]
        var dispatchQueue = this.initDispatchQueue(event);
        // set to true if any child handles this event
        var isEventHandled;

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

/**
 * Dispatches an event to every immediate child in the container, regardless of whether the event is handled or not
 * @type {*}
 */
var EveryChildContainerView = ContainerView.subClass({
    className: "EveryChildContainerView",
    init: function(julia, properties) {
        this._super(julia, properties);
    },
    /**
     * Initialize dispatch queue. This time, we want to dispatch to every child, so just initialize the queue with
     * every child. Then dispatch once, don' continue dispatch (and don' accumulate events).
     * @param event
     * @returns {Array}
     */
    initDispatchQueue: function(event) {
        var dispatchQueue = [];
        for(var i = this.children.length - 1; i >= 0; i--){
            dispatchQueue.push({actionSequence: new ActionRequestSequence(this, []), childIndex: i});
        }
        return dispatchQueue;
    },
    dispatchEvent: function(event) {
        var child;
        // Get the queue of items to dispatch to.
        var dispatchQueue = this.initDispatchQueue(event);

        // result contains the list of action requests sequences we are returning.
        // every item in result represents an alternate representation.
        var result = [];
        while(dispatchQueue.length > 0) {
            var cur = dispatchQueue.shift();
            var actionSequence = cur.actionSequence;
            child = this.children[cur.childIndex];
            var childResponses = child.dispatchEvent(event);
            var me = this;
            childResponses.forEach(function(response) {
                // Every child response represents an alternate interpretation, therefore for each response we want
                // to clone the original action sequence and append the response to the existing sequence.
                var actionSequence2 = actionSequence.clone();
                if(response instanceof ActionRequest) {
                    actionSequence2.requests.push(response);
                } else if (response instanceof ActionRequestSequence) {
                    actionSequence2.requests.extend(response.requests);
                } else {
                    throw "response not the right type!";
                }
                result.push(actionSequence2);
            });
        }
        return result;
    }
});
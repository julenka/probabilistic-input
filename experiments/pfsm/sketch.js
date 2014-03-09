/**
 * Created by julenka on 3/8/14.
 */

// TODO: add module system!
/*jshint strict:false */

var Sketch = Object.subClass({
    init: function(props) {
        this.children = [];
        this.probability = 1;

        // Make sure cloning of existing properties always happens after you initialize stuff
        if (typeof props == 'undefined') {
            return;
        }
        for(var name in props) {
            this[name] = props[name];
        }
    },
    dispatchEvent: function(e) {
        // by default, just copy yourself over
        // for each child
        // for each transition out of the child
        // if the child wants to handle the event...
        // clone the child
        // clone the sketch
        // TODO: probably won't be able to get away with cloning the entire UI for complex UIs.
        // set child.sketch
        // execute update code
        // add this new sketch to the list
        // if the event has been handled, stop
        // if the event has not been handled, then we need to keep dispatching the event. add this sketch sample to the list
        // of sketches you need to keep dispatching to
        var i,j;
        var my_response = [];
        // [ {new_sketch: XXX, action_request: XXX, feedback_request: XXX} ]
        var sketches_to_dispatch = [ {sketch: this, dispatch_index: 0}];
        while(sketches_to_dispatch.length != 0) {
            var dispatch_info = sketches_to_dispatch.shift();
            var sketch_to_dispatch = dispatch_info.sketch;
            for(i = dispatch_info.dispatch_index; i < sketch_to_dispatch.children.length; i++) {
                // send the event to the child. the child returns a list of new sketches and also whether the event has been handled
                // response: [ {control: control, handled: false, action: fn, feedback: fn}]
                var response = sketch_to_dispatch.children[i].dispatchEvent(e);
                for(j = 0; j < response.length; j++) {
                    // clone the sketch
                    // put in the new control
                    // if handled, add to sketches_to_dispatch
                    var new_sketch = this.clone();
                    new_sketch.children[i] = response[j].control;
                    response[j].control.sketch = new_sketch;
                    my_response.push(
                        {
                            new_sketch: new_sketch,
                            new_control: response[j].control,
                            update: response[j].update,
                            action_request: response[j].action,
                            feedback_request: response[j].feedback
                        });
                   if(!response.handled) {
                       sketches_to_dispatch.push({sketch: new_sketch, dispatch_index: i + 1});
                   }
                }
                if(response.length > 0) {
                    break;
                }
            }
        }

        // TODO: introduce z ordering, dispatch events to the same level
        return my_response;
    },
    // According to http://stackoverflow.com/a/5344074/809040, it is much faster to
    // manually copy all of your elements when cloning. So, right now we do this, because
    // we will be cloning a lot.
    clone: function() {
        // clone every child
        var new_children = [], i;
        for(i = 0; i < this.children.length; i++) {

            new_children.push(this.children[i].clone());
        }
        return new Sketch({children: new_children});
    },
    draw: function($el) {
        var i;
        for (i = 0; i < this.children.length; i++) {
            this.children[i].draw($el);
        }
    },

    /**
     *
     * @param child Interactor that has a state machine and variables and clone method
     */
    addChild: function(child) {
        this.children.push(child);
    }
});

//{
//    start: [
//        {
//            to: "red",
//            source: "mouse",
//            type: "click",
//            requires_finalization: false,
//            predicate: fn(e) {...}
//            update: fn(e) {...}
//            handles_event: bool
//        },
//
//    ]
//}

var Control = Object.subClass({
    init: function(sketch) {
        this.fsm_description = {};
        this.current_state = undefined;
        this.sketch = sketch;
    },
    clone_impl: function(control) {
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
                    handles_event: transition.handles_event,
                };
                new_state.push(new_transition);
            }
        }
        control.fsm_description[state] = new_state;
    },
    clone: function() {
        var result = new Control(this.sketch);
        this.clone_impl(result);
        return result;
    },
    draw: function($el) {
        $el.append("base control");
    },
    dispatchEvent: function(e) {
        var response = [], i;
        // response: [ {control: control, handled: false, action: fn, feedback: fn}]
        // for each transition
        var transitions = this.fsm_description[this.current_state], transition;
        var new_control;
        for(i = 0; i < transitions.length; i++) {
            transition = transitions[i];
            if(transition.source === e.source && transition.type === e.type && transition.predicate(e)) {
                new_control = this.clone();
                new_control.current_state = transition.to;
                response.push({control: new_control, handled: transition.handles_event,
                    action: transition.action, feedback: transition.feedback, update: transition.update});
            }
        }
        return response;
    }
});

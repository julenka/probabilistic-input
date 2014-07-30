/**
 * Created by julenka on 6/5/14.
 */
// THIS DEPENDS ON THE DOLLAR RECOGNIZER LIBRARY

// First, let's just draw out the path to the screen
var Octopocus = FSMView.subClass({
    className: "Octopocus",
    /**
     * properties:
     * onGestureRecognized(gesture)
     * onGestureNotRecognized()
     * @param julia
     * @param properties
     *  use_priors: if set to true, looks at last gesture and makes last gesture 2 times more likely;
     */
    init: function(julia, properties, onGestureCompleted) {
        var defaults = {
            use_priors: false
        };

        this._super(julia, properties, defaults);
        this.path = [];
        this.fsm_description = {
            start: [],
            down: [

            ]
        };
        this.recognizer = new DollarRecognizer();
        var gestures = ["rectangle", "triangle", "arrow"];
        var me = this;
        this.onGestureCompleted = onGestureCompleted;
        var colors = ["#AEEE00", "#01B0F0", "#FF358B", "#333333"];
        gestures.forEach(function(gesture, idx) {
            var state = "down_" + gesture;
            // for now, let's just assume that we are returning true with probably 0.33
            me.fsm_description.start.push(
                new MouseDownTransition(state,
                    RETURN_TRUE,
                function(e, rootView) {
                    this.gesture_start(e, rootView);
                    this.properties.color = colors[idx];
                },
                undefined,
                true
            ));
            var new_state = [
                new MouseMoveTransitionWithProbability(state,
                    me.recognizeGesture.curry(gesture),
                    me.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition("start",
                    function() { return true;},
                    undefined,
                    function() {
                        this.path = [];
                        this.gesture_to_show = undefined;
                        if(this.onGestureCompleted) {
                            this.onGestureCompleted(gesture);
                        }
                    },
                    true
                )
            ];
            me.fsm_description[state] = new_state;
        });
    },
    recognizeGesture: function(gestureName) {
        var recognizer = this.recognizer;
        var prior = 1;
        if(this.properties.use_priors && window.__julia_last_gesture ) {
            if(window.__julia_last_gesture === gestureName) {
                prior = 0.9;
            } else {
                prior = 0.8;
            }
        }
        for(var i = 0; i < recognizer.Unistrokes.length; i++) {
            if(recognizer.Unistrokes[i].Name === gestureName) {
                var unistroke = recognizer.Unistrokes[i].Points;
                var g1 = deepCopy(unistroke);
                var n = this.path.length;
                g1.splice(0,n);
                if(g1.length === 0 || n == 0) {
                    return false;
                }

                var last_mouse_point = this.path[this.path.length - 1];
                var dp = {x: g1[0].X - last_mouse_point.x, y: g1[0].Y - last_mouse_point.y};
                var mouse_path2 = this.path.map(
                    function(p) {
                        return {X: p.x + dp.x, Y: p.y + dp.y};
                    }
                );
                var concatenated_gesture = mouse_path2.concat(g1);

                var results = recognizer.Recognize(concatenated_gesture, false);
                var gesture_probability = results[i].Score;

                var p0 = this.path[this.path.length - 1];
                dp = {x: p0.x - g1[0].X, y: p0.y - g1[0].Y};
                this.gesture_to_show = concatenated_gesture.map(
                    function(p) {
                        return {X: p.X + dp.x, Y: p.Y + dp.y};
                    }
                );
                return gesture_probability * prior;
            }
        }

        return false;
    },
    clone: function() {
        var result = this._super();
        result.path = deepCopy(this.path);
        result.gesture_to_show = deepCopy(this.gesture_to_show);
        result.onGestureCompleted = this.onGestureCompleted;
        return result;
    },
    add_to_path: function(e) {
        var x = e.base_event.element_x;
        var y = e.base_event.element_y;
        this.path.push({x: x, y: y});
    },
    gesture_start: function(e, rootView) {
        this.path = [];
        this.add_to_path(e);
    },
    gesture_progress: function(e, rootView) {
        this.add_to_path(e);
        // Draw the gesture here
    },
    draw: function($el, my_probability) {
        var s = Snap($el[0]);
        var thickness = 10;//(10 * Math.pow(my_probability,5)  + 1);
        if(this.gesture_to_show) {
            s.path("M" + this.gesture_to_show.map(function(el){ return el.X + "," + el.Y; }).join("L"))
                .attr({stroke: this.properties.color, fill: "none",
                    "stroke-width": thickness, "stroke-linecap": "round"});
        }

    }
});
/**
 * Created by julenka on 6/5/14.
 */
// THIS DEPENDS ON THE DOLLAR RECOGNIZER LIBRARY

// First, let's just draw out the path to the screen
var GestureRecognizer = FSMView.subClass({
    className: "GestureRecognizer",
    /**
     * properties:
     * onGestureRecognized(gesture)
     * onGestureNotRecognized()
     * @param julia
     * @param properties
     */
    init: function(julia, properties) {
        this._super(julia, properties,
            {color: "green", radius: 5, opacity: 1});
        this.path = [];
        this.fsm_description = {
            start: [
                new MouseDownTransition("down",
                    RETURN_TRUE,
                    this.gesture_start,
                    undefined,
                    true
                    )
            ],
            down: [
                new MouseMoveTransition("down",
                    RETURN_TRUE,
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability("start",
                    function() { return 0.7; },
                    this.gesture_not_recognized,
                    undefined,
                    true
                )
            ]

        };
        var gestures = ["circle", "rectangle", "triangle"];
        var me = this;
        gestures.forEach(function(gesture) {
            // for now, let's just assume that we are returning true with probably 0.33
            me.fsm_description.down.push(new MouseUpTransitionWithProbability("start",
                function(e, rootView) {
                    return this.recognizeGesture(gesture);
                },
                function(e, rootView) {
                    this.gesture_recognized(gesture, e, rootView);
                    this.path = [];
                },
                undefined,
                true
            ));
        });
    },
    /**
     * Converts points from a format that I use {x: , y: } to the format used by $1 recognizer {X: ,Y:}
     * @param points
     */
    convertPoints: function(path) {
        return path.map(function(point) { return {X: point.x, Y: point.y}});
    },
    recognizeGesture: function(gestureName) {
        var dollarPoints = this.convertPoints(this.path);
        var recognizer = new DollarRecognizer();

        // This will perform unecessary computations. TODO: cache the recognition result if we have perf issues
        var results = recognizer.Recognize(dollarPoints, false);
        for(var i = 0; i < results.length; i++) {
            if(results[i].Name === gestureName) {
                var score = results[i].Score;
                if(score < 0.8) {
                    return false;
                }
                return results[i].Score;
            }
        }
        return 0;
    },
    clone: function() {
        var result = this._super();
        result.path = deepCopy(this.path);
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
    },
    gesture_not_recognized: function(e, rootView) {
        if(typeof(this.properties.onGestureNotRecognized) !== 'undefined') {
            this.properties.onGestureNotRecognized(rootView);
        }
        this.path = [];
    },
    gesture_recognized: function(gesture_name, e, rootView) {
        if(typeof(this.properties.onGestureRecognized) !== 'undefined') {
            this.properties.onGestureRecognized(gesture_name, rootView);
        }
    },
    draw: function($el) {
        var s = Snap($el[0]);
        if (this.path.length > 1) {
            s.path("M" + this.path.map(function(el){ return el.x + "," + el.y; }).join("L"))
                .attr({stroke: this.properties.color, fill: "none",
                "stroke-width": this.properties.radius, opacity: this.properties.opacity});
        }
    }
});
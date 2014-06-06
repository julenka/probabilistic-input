/**
 * Created by julenka on 6/5/14.
 */

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
                    function() { return true},
                    this.gesture_start,
                    undefined,
                    true
                    )
            ],
            down: [
                new MouseMoveTransition("down",
                    function() { return true },
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition("start",
                    Math.dieRoll.curry(0.7),
                    this.gesture_not_recognized,
                    undefined,
                    true
                )
            ]
        };
        var gestures = ["circle"];
        var me = this;
        gestures.forEach(function(gesture) {
            // for now, let's just assume that we are returning true with probably 0.33
            me.fsm_description.down.push(new MouseUpTransition("start",
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
    recognizeGesture: function(gestureName) {
        var probability = 0;
        if(gestureName === "circle") {
            var minx = 10000, miny = 10000, maxx = 0, maxy = 0;
            var path = this.path;
            for(var i = 0; i < path.length; i++) {
                var p = path[i];
                if(p.x < minx) {
                    minx = p.x;
                }
                if(p.y < miny) {
                    miny = p.y;
                }
                if(p.x > maxx) {
                    maxx = p.x;
                }
                if(p.y > maxy) {
                    maxy = p.y;
                }
            }
            var cx = (minx + maxx) / 2;
            var cy = (miny + maxy) / 2;
            var distances = [];
            for(i = 0; i < path.length; i++) {
                p = path[i];
                var dx = p.x - cx;
                var dy = p.y - cy;
                distances.push(Math.sqrt(dx * dx + dy * dy));
            }
            var stdev = distances.stdev();
            var mean = distances.mean();
            var ratio = stdev / mean;
            probability = Math.remap(ratio, 0, 1, 1, 0);
            var p1 = path[0];
            var p2 = path[path.length - 1];
            var dx = p1.x - p2.x;
            var dy = p1.y - p2.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            var ratio = Math.remap(d / mean, 0, 1, 1, 0);
            probability *= ratio;
            if(probability < 0.2) {
                probability = 0;
            }
        }
        return Math.dieRoll(probability);
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
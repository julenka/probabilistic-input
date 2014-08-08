/**
 * Created by julenka on 6/10/14.
 */

// First, let's just draw out the path to the screen
var PathBrush = FSMView.subClass({
    className: "PathBrush",
    /**
     * properties:
     * color: color of the path
     * opacity: path opacity
     * width: path width (default is 1)
     * onPathCompleted(path, root)
     * onLineCompleted(start{x:,y:}, end{x:,y:})
     * @param julia
     * @param properties
     */
    init: function(julia, properties) {
        this._super(julia, properties,
            {color: "black", opacity: 1, use_priors: false,
                width: 1,
                default_predicate_probability: 0.6,
                default_predicate_probability_with_prior: 1.0,
                pathProbability: function(e) {
                    return 1.0; }
            });
        this.path = [];
        this.gesture_detector = new SimpleGestureDetector();
        this.fsm_description = {
            start: [
                new MouseDownTransitionWithProbability("down_path",
                    this.down_predicate.curry("down_path"),
                    this.gesture_start,
                    undefined,
                    true
                    ),
                new MouseDownTransitionWithProbability("down_line",
                    this.down_predicate.curry("down_line"),
                    this.gesture_start,
                    undefined,
                    true
                ),
                new MouseDownTransitionWithProbability("down_horiz",
                    this.down_predicate.curry("down_horiz"),
                    this.gesture_start,
                    undefined,
                    true
                ),
                new MouseDownTransitionWithProbability("down_vert",
                    this.down_predicate.curry("down_vert"),
                    this.gesture_start,
                    undefined,
                    true
                )
            ],
            down_horiz: [
                new MouseMoveTransition("down_horiz",
                    this.horizontal_predicate,
                    this.gesture_progress_horiz,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability("start",
                    this.properties.pathProbability,
                    undefined,
                    this.line_completed,
                    true
                )
            ],
            down_vert: [
                new MouseMoveTransition("down_vert",
                    this.vertical_predicate,
                    this.gesture_progress_vert,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability("start",
                    this.properties.pathProbability,
                    undefined,
                    this.line_completed,
                    true
                )
            ],
            down_path: [
                new MouseMoveTransition("down_path",
                    RETURN_TRUE,
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability("start",
                    this.properties.pathProbability,
                    undefined,
                    this.path_completed,
                    true
                )
            ],
            down_line: [
                new MouseMoveTransition("down_line",
                    RETURN_TRUE,
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability("start",
                    this.properties.pathProbability,
                    undefined,
                    this.line_completed,
                    true
                )
            ]

        };

    },
    /**
     * Maps actions (defined in path_priors.html) to destination states
     * Used in down_predicate function
     */
    action_to_state: {
        "line": "down_line",
        "horizontal line": "down_horiz",
        "vertical line": "down_vert"
    },
    down_predicate: function(to_state) {
        // TODO: the predicate to_state doesn't match actual state strings! Ugh! Fix up in priors demo.
        var handlers = {down_path: this.properties.onPathCompleted, down_line: this.properties.onLineCompleted,
        down_horiz: this.properties.onLineCompleted, down_vert: this.properties.onLineCompleted};
        // If there is no handler for this state, then don't go to that state
        if(!handlers[to_state]) {
            return 0;
        }
        if(this.properties.use_priors && window.__julia_last_action) {
            // For path_priors demo. Maintaint prior action in a global state for now
            // TODO: if you release this code this needs to be cleaned up
            if(to_state === this.action_to_state[window.__julia_last_action]) {
                return this.properties.default_predicate_probability_with_prior;
            }
            return this.properties.default_predicate_probability;
        }
        return 1;
    },
    clone: function() {
        var result = this._super();
        result.path = deepCopy(this.path);
        result.gesture_detector = this.gesture_detector.clone();
        return result;
    },
    add_to_path: function(e) {
        var x = e.base_event.element_x;
        var y = e.base_event.element_y;
        this.path.push({x: x, y: y});
    },
    gesture_start: function(e, rootView) {
        this.path = [];
        this.gesture_detector.start(e);
        this.add_to_path(e);
    },
    update_motion: function(e) {
        this.gesture_detector.update(e);
    },
    horizontal_predicate: function(e) {
        var gesture = this.gesture_detector.detect();
        if(gesture === SimpleGestureDetector.prototype.GESTURE_HORIZONTAL) {
            return true;
        }
        return Math.dieRoll(0.5);
    },
    vertical_predicate: function(e) {
        var gesture = this.gesture_detector.detect();
        if(gesture === SimpleGestureDetector.prototype.GESTURE_VERTICAL) {
            return true;
        }
        return Math.dieRoll(0.5);
    },
    gesture_progress_horiz: function(e, rootView) {
        this.update_motion(e);
        var x = e.base_event.element_x;
        var y = this.gesture_detector.down_y;
        this.path.push({x: x, y: y});
    },
    gesture_progress_vert: function(e, rootView) {
        this.update_motion(e);
        var x = this.gesture_detector.down_x;
        var y = e.base_event.element_y;
        this.path.push({x: x, y: y});
    },
    gesture_progress: function(e, rootView) {
        this.add_to_path(e);
    },
    path_completed: function(e, rootView) {
        if(typeof(this.properties.onPathCompleted) !== 'undefined') {
            this.properties.onPathCompleted(this.path, rootView);
        }
    },
    line_completed: function(e, rootView) {
        if(typeof(this.properties.onLineCompleted) !== 'undefined') {
            this.properties.onLineCompleted(this.path[0], this.path[this.path.length - 1], rootView);
        }
    },
    draw: function($el) {
        var s = Snap($el[0]);
        if(this.path.length < 1) {
            return;
        }
        var properties = {stroke: this.properties.color, fill: "none",
            "stroke-width": this.properties.width, opacity: this.properties.opacity};

        if(this.current_state === "down_path") {
            s.path("M" + this.path.map(function(el){ return el.x + "," + el.y; }).join("L"))
                .attr(properties);
        } else if (this.current_state in {down_line: true, down_horiz: true, down_vert:true} ) {
            var p1 = this.path[0];
            var p2 = this.path[this.path.length -  1];
            s.line(p1.x, p1.y, p2.x, p2.y).attr(properties);
        }
    }
});


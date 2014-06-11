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
            {color: "black", opacity: 1, width: 1});
        this.path = [];
        this.fsm_description = {
            start: [
                new MouseDownTransition("down_path",
                    function() { return true; },
                    this.gesture_start,
                    undefined,
                    true
                    ),
                new MouseDownTransition("down_line",
                    function() { return true; },
                    this.gesture_start,
                    undefined,
                    true
                ),
            ],
            down_line: [
                new MouseMoveTransition("down_line",
                    function() { return true; },
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition("start",
                    function() { return true; },
                    undefined,
                    this.line_completed,
                    true
                )
            ],
            down_path: [
                new MouseMoveTransition("down_path",
                    function() { return true; },
                    this.gesture_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition("start",
                    function() { return true; },
                    undefined,
                    this.path_completed,
                    true
                )
            ]

        };

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
        } else if (this.current_state === "down_line") {
            var p1 = this.path[0];
            var p2 = this.path[this.path.length -  1];
            s.line(p1.x, p1.y, p2.x, p2.y).attr(properties);
        }
    }
});


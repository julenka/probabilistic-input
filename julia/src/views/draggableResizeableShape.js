/**
 * Created by julenka on 5/24/14.
 */

// TODO: This depends on Julia. Figure out how to specify this.


/**
 * A rectangle that is draggable
  * @type {*}
 */
var DraggableShape = FSMView.subClass({
    className: "DraggableBox",
    /**
     * Represents an object that can be dragged
     * x:
     * y:
     * w:
     * h:
     * @param julia
     * @param properties
     */
    init: function (julia, properties, defaults) {
        var this_defaults = {color:"#444444", "stroke-width": 0, stroke: "black", x: 0, y: 0, w: 0, h: 0};
        $.extend(this_defaults, defaults);
        this._super(julia, properties, this_defaults);
        // {mouse_x, mouse_y, my_x, my_y}
        this.drag_start_info= {};

        this.fsm_description = {
            start: [
                //   init: function(to, drag_predicate, feedback_action, final_action, handles_event) {
                new MouseDownTransition(
                    "dragging",
                    this.hit_test,
                    this.drag_start,
                    undefined,
                    true)
            ],
            dragging: [
                new MouseMoveTransitionWithProbability(
                    "dragging",
                    this.drag_predicate,
                    this.drag_progress,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability(
                    "start",
                    this.drag_predicate,
                    undefined,
                    this.drag_end,
                    true
                )
            ]
        };
    },
    get_relative: function(e) {
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y;
        return {rx: rx, ry: ry};
    },
    get_relative_motion: function(e) {
        return {
            dx:e.base_event.element_x - this.drag_start_info.mouse_x,
            dy:e.base_event.element_y - this.drag_start_info.mouse_y
        };
    },
    hit_test: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > 0 && coords.ry > 0 && coords.rx < this.properties.w && coords.ry < this.properties.h);
    },
    drag_predicate: function(e) {
        return 1;
    },
    /**
     * Called when a gesture (e.g. the drag, in this case) starts.
     * Store information about the start of the gesture here.
     * @param e
     */
    gesture_start: function(e) {
        this.drag_start_info.mouse_x = e.base_event.element_x;
        this.drag_start_info.mouse_y = e.base_event.element_y;
        this.drag_start_info.my_x = this.properties.x;
        this.drag_start_info.my_y = this.properties.y;
        this.drag_start_info.my_w = this.properties.w;
        this.drag_start_info.my_h = this.properties.h;
    },
    drag_start: function(e, rootView) {
        // the index of the event sample that we received when a drag was initiated
        this.gesture_start(e);
    },
    drag_progress: function(e, rootView) {
        var motion = this.get_relative_motion(e);
        this.properties.x = this.drag_start_info.my_x + motion.dx;
        this.properties.y = this.drag_start_info.my_y + motion.dy;
    },
    drag_end: function(e, rootView) {
    },
    draw: function ($el) {
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        if(this.current_state === "dragging") {
            this.drawDragFeedback($el);
        }

        this.drawShape($el);
    },
    drawDragFeedback: function ($el) {
    },
    drawShape: function($el) {

    },
    drawAmbiguous: function($el) {
        this.draw($el);
        var s = Snap($el[0]);
        var x = this.properties.x + this.properties.w / 2 - 12;
        var y = this.properties.y + this.properties.h / 2 + 24;
        s.text(x, y, "?").attr({'font-family':'Arial, Helvetical', 'font-size': '48px', opacity: 0.5});
    },
    clone: function() {
        var result = this._super();
        result.drag_start_info = shallowCopy(this.drag_start_info);
        return result;
    },

    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return shallowEquals(this.properties, other.properties);
    }
});

var DraggableBox = DraggableShape.subClass({
    className: "DraggableBox",
    init: function(julia, properties) {
        this._super(julia, properties);
    },
    drawDragFeedback: function($el) {
        var s = Snap($el[0]);
        var padding = 5;
        s.rect(this.properties.x - padding, this.properties.y - padding, this.properties.w + 2 * padding, this.properties.h + 2 * padding)
            .attr({fill: "white", "stroke-width": 1, stroke: "black"});
    },
    drawShape: function($el) {
        var s = Snap($el[0]);
        s.rect(this.properties.x, this.properties.y, this.properties.w, this.properties.h).attr(
            {fill: this.properties.color,
                "stroke-width": this.properties["stroke-width"],
                stroke: this.properties.stroke});
    }
});

/**
 * A rectangle that is draggable and resizeable
 * @type {*}
 */
var DraggableResizeableShape = DraggableShape.subClass({
    className: "DraggableResizeableBox",
    /**
     * A rectangle that can be dragged and resized
     * x:
     * y:
     * w:
     * h:
     * resize_padding:
     * min_w:
     * min_h
     * @param julia
     * @param properties
     */
    init: function (julia, properties) {
        this._super(julia, properties, {"resize_padding": 10, "min_w": 10, "min_h": 10});

        var new_states = ["resize_left", 'resize_top', "resize_right", "resize_bottom",
        "resize_nw", "resize_ne", "resize_sw", "resize_se"];
        for(var i = 0; i < new_states.length; i++) {
            var name = new_states[i];
            this.fsm_description.start.push(
                new MouseDownTransitionWithProbability(
                    name,
                    function(e, transition) {
                        if(this.hit_test(e, transition)) {
                            return 0.6;
                        }
                        return 0;
                    },
                    this.drag_start,
                    undefined,
                    true)
            );
            this.fsm_description[name] = [
                new MouseMoveTransitionWithProbability(
                    name,
                    this.drag_predicate,
                    this.drag_progress,
                    undefined,
                    true
                ), new MouseUpTransitionWithProbability(
                    "start",
                    this.drag_predicate,
                    undefined,
                    this.drag_end,
                    true
                )
            ];
        }
        this.initControlPoints(new_states);
        this.updateControlPoints();
    },
    /**
     * Initialize the control points that are used to resize this element
     */
    initControlPoints: function(new_states) {
        // control point has position
        // control point radius is fixed
        this.properties.ctrl_pt_radius = 10;
        this.properties.ctrl_pts = {};
        var me = this;
        // to_state, {x, y}
        new_states.forEach(function(state) {
             me.properties.ctrl_pts[state] = {x: 0, y: 0};
        });
    },
    hitTestControlPoint: function(state, x, y) {
        var ctrl_pt = this.properties.ctrl_pts[state];
        return Math.sqrt(Math.pow(ctrl_pt.x - x, 2) + Math.pow(ctrl_pt.y - y, 2)) < this.properties.ctrl_pt_radius;
    },
    /**
     * Updates the control points based on the new position and size
     */
    updateControlPoints: function() {
        var ctrl_pts = this.properties.ctrl_pts;
        var x = this.properties.x;
        var y = this.properties.y;
        var w = this.properties.w;
        var h = this.properties.h;
        // left
        ctrl_pts.resize_left.x = x;
        ctrl_pts.resize_left.y = y + h / 2;
        // right
        ctrl_pts.resize_right.x = x + w ;
        ctrl_pts.resize_right.y = y + h / 2;
        // top
        ctrl_pts.resize_top.x = x + w / 2;
        ctrl_pts.resize_top.y = y;
        // bottom
        ctrl_pts.resize_bottom.x = x + w / 2;
        ctrl_pts.resize_bottom.y = y + h;
        // ne
        ctrl_pts.resize_ne.x = x + w;
        ctrl_pts.resize_ne.y = y;
        // nw
        ctrl_pts.resize_nw.x = x;
        ctrl_pts.resize_nw.y = y;
        // se
        ctrl_pts.resize_se.x = x + w;
        ctrl_pts.resize_se.y = y + h;
        // sw
        ctrl_pts.resize_sw.x = x;
        ctrl_pts.resize_sw.y = y + h;
    },
    drawControlPoints: function($el) {
        var s = Snap($el[0]);
        for (var state in this.properties.ctrl_pts) {
            var opacity = 0.5;
            var color = 'white';
            if(this.current_state === state) {
                opacity = 1;
                color = 'red';
            }
            var pt = this.properties.ctrl_pts[state];
            s.circle(pt.x, pt.y, this.properties.ctrl_pt_radius).attr({
                fill: color,
                stroke: 'black',
                opacity: opacity
            });
        }
    },
    drag_predicate: function(e) {
        var dx = Math.abs(this.drag_start_info.mouse_x - e.element_x);
        var dy = Math.abs(this.drag_start_info.mouse_y - e.element_y);
        // TODO: this should be resolution independent, and should have to do with probabilities...
        if(this.resizingHorizontally() && dy > 30) {
            return 0.9;
        } else if (this.resizingVertically() && dx > 30) {
            return 0.9;
        }
        return 1;
    },
    resizingVertically: function() { return this.current_state === "resize_top" || this.current_state === "resize_bottom";},
    resizingHorizontally: function() { return this.current_state === "resize_left" || this.current_state === "resize_right";},
    drag_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_w = this.properties.w;
        var new_h = this.properties.h;
        var new_x = this.properties.x;
        var new_y = this.properties.y;
        if(this.current_state === "dragging") {
            new_x = this.drag_start_info.my_x + motion.dx;
            new_y = this.drag_start_info.my_y + motion.dy;
        }
        if(this.current_state === "resize_left" || this.current_state === "resize_nw" || this.current_state === "resize_sw") {
            new_w = this.properties.w = this.drag_start_info.my_w - motion.dx;
            new_x = this.drag_start_info.my_x + motion.dx;
        }
        if(this.current_state === "resize_right" || this.current_state === "resize_ne" || this.current_state === "resize_se") {
            new_w = this.drag_start_info.my_w + motion.dx;
        }

        if(this.current_state === "resize_top" || this.current_state === "resize_ne" || this.current_state === "resize_nw") {
            new_h = this.drag_start_info.my_h - motion.dy;
            new_y = this.drag_start_info.my_y + motion.dy;
        }
        if(this.current_state === "resize_bottom" || this.current_state === "resize_se" || this.current_state === "resize_sw") {
            new_h = this.drag_start_info.my_h + motion.dy;
        }
        if(new_h < this.properties.min_h) { return; }
        if(new_w < this.properties.min_w) { return; }
        this.properties.x = new_x;
        this.properties.y = new_y;
        this.properties.w = new_w;
        this.properties.h = new_h;
        this.updateControlPoints();
    },
    dragHitTest: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > this.properties.resize_padding && coords.ry > this.properties.resize_padding && coords.rx < this.properties.w - this.properties.resize_padding && coords.ry < this.properties.h - this.properties.resize_padding);
    },
    hit_test: function(e, transition) {
        if(transition.to === "dragging") {
            return this.dragHitTest(e);
        } else {
            return this.hitTestControlPoint(transition.to, e.base_event.element_x, e.base_event.element_y);
        }
    },
    draw: function ($el) {
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        var padding = 5;
        var border_attrs = {fill: "white", "stroke-width": 1, stroke: "black"};
        if(this.current_state === "dragging") {
            this.drawDragFeedback($el);
        }
        this.drawShape($el) ;
        this.drawControlPoints($el);

    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return true;
    }
});

var DraggableResizeableBox = DraggableResizeableShape.subClass({
    className: "DraggableBox",
    init: function(julia, properties) {
        this._super(julia, properties);
    },
    drawShape: function($el) {
        var s = Snap($el[0]);
        s.rect(this.properties.x, this.properties.y, this.properties.w, this.properties.h).attr(
            {fill: this.properties.color,
                "stroke-width": this.properties["stroke-width"],
                stroke: this.properties.stroke});
    },
    drawDragFeedback: function($el) {
        var s = Snap($el[0]);
        var padding = 5;
        s.rect(this.properties.x - padding, this.properties.y - padding, this.properties.w + 2 * padding, this.properties.h + 2 * padding)
            .attr({fill: "white", "stroke-width": 1, stroke: "black"});
    }
});
var DraggableResizeableEllipse = DraggableResizeableShape.subClass({
    className: "DraggableEllipse",
    init: function(julia, properties) {
        this._super(julia, properties);
    },
    drawShape: function($el) {
        var s = Snap($el[0]);
        var x = this.properties.x + this.properties.w / 2;
        var y = this.properties.y + this.properties.h / 2;
        s.ellipse(x, y, this.properties.w / 2, this.properties.h / 2).attr(
            {fill: this.properties.color,
                "stroke-width": this.properties["stroke-width"],
                stroke: this.properties.stroke});
    },
    drawDragFeedback: function($el) {
        var padding = 5;
        var s = Snap($el[0]);
        var x = this.properties.x + this.properties.w / 2;
        var y = this.properties.y + this.properties.h / 2;
        s.ellipse(x, y, this.properties.w / 2 + padding, this.properties.h / 2 + padding).attr(
            {fill: this.properties.color,
                "stroke-width": this.properties["stroke-width"],
                stroke: this.properties.stroke});
    },
    dragHitTest: function(e) {
        var coords = this.get_relative(e);
        var rx = this.properties.w / 2;
        var ry = this.properties.h / 2;
        var cx = coords.rx - rx;
        var cy = coords.ry - ry;
        // http://math.stackexchange.com/questions/76457/check-if-a-point-is-within-an-ellipse
        var dx = Math.pow(cx, 2) / Math.pow(rx, 2);
        var dy = Math.pow(cy, 2) / Math.pow(ry, 2);
        return dx + dy <= 1;

    }
});
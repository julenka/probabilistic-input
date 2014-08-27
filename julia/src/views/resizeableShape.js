/**
 * Created by julenka on 5/24/14.
 */

/** NASTY: this file MUST be included after draggableShape! **/

/**
 * A shape that is draggable and resizeable
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
        this._super(julia, properties, {over_state: false, "resize_padding": 20, "min_w": 10, "min_h": 10});
        var new_states = ["resize_left", 'resize_top', "resize_right", "resize_bottom",
            "resize_nw", "resize_ne", "resize_sw", "resize_se"];
        this.initFSM(new_states);
        this.initControlPoints(new_states);
        this.updateControlPoints();
    },
    initFSM: function(new_states) {
        this.fsm_description = {
            start: [

                new MouseDownTransition(
                    "dragging",
                    this.predicateStartDrag,
                    this.updateStartDrag,
                    undefined,
                    true),
            ],
            over : [
                new MouseDownTransition(
                    "dragging",
                    this.predicateStartDrag,
                    this.updateStartDrag,
                    undefined,
                    true),
                new MouseMoveTransition(
                    "start",
                    function(e){ return !this.boundingBoxHitTest(e); },
                    function(){},
                    undefined,
                    false)
            ],
            dragging: [
                new MouseMoveTransitionWithProbability(
                    "dragging",
                    this.predicateDragProgress,
                    this.updateDragProgress,
                    undefined,
                    true
                ),
                new MouseUpTransitionWithProbability(
                    "start",
                    this.predicateDragProgress,
                    undefined,
                    this.onDragEnd,
                    true
                )
            ]
        };
        // over state specifies whether we want to have a 'mouse over' state
        if(this.properties.over_state) {
            this.fsm_description[start].push(
                new MouseMoveTransition(
                    "over",
                    this.boundingBoxHitTest,
                    function(){},
                    undefined,
                    true)
            );
        }


        for(var i = 0; i < new_states.length; i++) {
            var name = new_states[i];
            this.fsm_description.over.push(
                new MouseDownTransitionWithProbability(
                    name,
                    this.predicateResizeStart,
                    this.updateResizeStart,
                    undefined,
                    true
                )
            );
            this.fsm_description.start.push(
                new MouseDownTransitionWithProbability(
                    name,
                    this.predicateResizeStart,
                    this.updateResizeStart,
                    undefined,
                    true)
            );
            this.fsm_description[name] = [
                new MouseMoveTransitionWithProbability(
                    name,
                    this.predicateDragProgress,
                    this.updateDragProgress,
                    undefined,
                    true
                ), new MouseUpTransitionWithProbability(
                    "start",
                    this.predicateDragProgress,
                    undefined,
                    this.onDragEnd,
                    true
                )
            ];
        }
    },
    /**
     * Update function for going from start->resize and over->resize
     * @param e
     */
    updateResizeStart: function(e) {
        this.gestureStart(e);
    },
    /**
     * Predicate for start->resize and over->resize
     * @param e
     * @param transition
     * @returns {*}
     */
    predicateResizeStart: function(e, transition) {
        if(this.hitTest(e, transition)) {
            return this.properties.default_predicate_probability;
        }
        return 0;
    },
    predicateDragProgress: function(e) {
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
    /**
     * Looks for snap points within radius of the given point.
     * Returns a list of all valid snap points.
     * Currently, snap points are just control points.
     */
    snapPointsNear: function(point, radius) {
        var result = [];
        // Using sylvester
        var ptV = $V([point.x, point.y]);
        for(var state in this.properties.ctrl_pts) {
            var pt = this.properties.ctrl_pts[state];
            // control point Vector
            var cV = $V([pt.x, pt.y]);
            if(cV.distanceFrom(ptV) < radius) {
                result.push({x: pt.x, y: pt.y});
            }
        }
        return result;
    },
    /**
     * Initialize the control points that are used to resize this element
     */
    initControlPoints: function(new_states) {
        // control point has position
        // control point radius is fixed
        this.properties.ctrl_pt_radius = 15;
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

    resizingVertically: function() { return this.current_state === "resize_top" || this.current_state === "resize_bottom";},
    resizingHorizontally: function() { return this.current_state === "resize_left" || this.current_state === "resize_right";},
    updateDragProgress: function(e) {
        var motion = this.getRelativeMotion(e);
        var new_w = this.properties.w;
        var new_h = this.properties.h;
        var new_x = this.properties.x;
        var new_y = this.properties.y;
        if(this.current_state === "dragging") {
            new_x = this.drag_start_info.my_x + motion.dx;
            new_y = this.drag_start_info.my_y + motion.dy;
        }
        if(this.current_state === "resize_left" || this.current_state === "resize_nw" || this.current_state === "resize_sw") {
            new_w = this.drag_start_info.my_w - motion.dx;
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
        if(new_h > this.properties.min_h) {
            this.properties.y = new_y;
            this.properties.h = new_h;
        }
        if(new_w > this.properties.min_w) {
            this.properties.x = new_x;
            this.properties.w = new_w;
        }

        this.updateControlPoints();
        this.sendUpdateDragProgress();
    },
    boundingBoxHitTest: function(e) {
        var coords = this.getRelative(e);
        return (coords.rx > -this.properties.resize_padding
            && coords.ry > -this.properties.resize_padding
            && coords.rx < this.properties.w + this.properties.resize_padding
            && coords.ry < this.properties.h + this.properties.resize_padding);
    },
    hitTest: function(e, transition) {
        if(transition.to === "dragging") {
            return this.boundingBoxHitTest(e);
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
        this.drawShape($el);
        if(this.current_state !== "start" && this.current_state !== "dragging") {
            this.drawControlPoints($el);
        }

    },
    drawDebugInfo: function(s) {
        var p_strs = [];
        function helper(o) {
            for(var p in o) {
                var v = o[p];
                if(v instanceof Object) {
                    helper(v);
                } else {
                    p_strs.push(p + ":" + v);
                }
            }
        }
        helper(this.properties);

        var cur_y = 10;
        s.text(50, cur_y, this.current_state);
        p_strs.forEach(function(str) {
            cur_y += 15;
            s.text(50, cur_y, str);
        });
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
            .attr({fill: "white", "stroke-width": 1, stroke: "black", opacity: 0.7});
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
                stroke: this.properties.stroke, opacity: 0.7});
    },
    dragHitTest: function(e) {
        var coords = this.getRelative(e);
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
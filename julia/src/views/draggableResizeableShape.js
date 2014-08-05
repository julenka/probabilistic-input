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
            var padding = 5;
            s.rect(this.properties.x - padding, this.properties.y - padding, this.properties.w + 2 * padding, this.properties.h + 2 * padding)
                .attr({fill: "white", "stroke-width": 1, stroke: "black"});
        }

        this.drawShape($el);
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

        var new_states = ["resize_left", 'resize_top', "resize_right", "resize_bottom"];
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
        switch(this.current_state) {
            case "dragging":
                new_x = this.drag_start_info.my_x + motion.dx;
                new_y = this.drag_start_info.my_y + motion.dy;
                break;
            case "resize_left":
                new_w = this.properties.w = this.drag_start_info.my_w - motion.dx;
                new_x = this.drag_start_info.my_x + motion.dx;
                break;
            case "resize_right":
                new_w = this.drag_start_info.my_w + motion.dx;
                break;
            case "resize_top":
                new_h = this.drag_start_info.my_h - motion.dy;
                new_y = this.drag_start_info.my_y + motion.dy;
                break;
            case "resize_bottom":
                new_h = this.drag_start_info.my_h + motion.dy;;
                break;

        }
        if(new_h < this.properties.min_h) { return; }
        if(new_w < this.properties.min_w) { return; }
        this.properties.x = new_x;
        this.properties.y = new_y;
        this.properties.w = new_w;
        this.properties.h = new_h;
    },
    hit_test: function(e, transition) {
        var coords = this.get_relative(e);
        switch(transition.to) {
            case "dragging":
                return (coords.rx > this.properties.resize_padding && coords.ry > this.properties.resize_padding && coords.rx < this.properties.w - this.properties.resize_padding && coords.ry < this.properties.h - this.properties.resize_padding);
            case "resize_left":
                return (coords.rx > -this.properties.resize_padding && coords.rx < this.properties.resize_padding && coords.ry > 0 && coords.ry < this.properties.h);
            case "resize_right":
                return (coords.rx > this.properties.w - this.properties.resize_padding && coords.rx < this.properties.w + this.properties.resize_padding && coords.ry > 0 && coords.ry < this.properties.h);
            case "resize_top":
                return (coords.ry > - this.properties.resize_padding && coords.ry < this.properties.resize_padding && coords.rx > 0 && coords.rx < this.properties.w);
            case "resize_bottom":
                return (coords.ry > this.properties.h - this.properties.resize_padding && coords.ry < this.properties.h + this.properties.resize_padding && coords.rx > 0 && coords.rx < this.properties.w);
        }
    },
    draw: function ($el) {
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        var padding = 5;
        var border_attrs = {fill: "white", "stroke-width": 1, stroke: "black"};
        if(this.current_state === "dragging") {
            s.rect(this.properties.x - padding, this.properties.y - padding, this.properties.w + 2 * padding, this.properties.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_left") {
            s.rect(this.properties.x - padding, this.properties.y - padding, 2 * padding, this.properties.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_right") {
            s.rect(this.properties.x + this.properties.w - padding, this.properties.y - padding, 2 * padding, this.properties.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_top") {
            s.rect(this.properties.x - padding, this.properties.y - padding, this.properties.w + 2 * padding, 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_bottom") {
            s.rect(this.properties.x - padding, this.properties.y + this.properties.h - padding, this.properties.w + 2 * padding, 2 * padding)
                .attr(border_attrs);
        }
        this.drawShape($el) ;
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
    }

    hit_test: function(e, transition) {
        var coords = this.get_relative(e);
        var cx = this.properties.x + this.properties.w/2;
        var cy = this.properties.y + this.properties.h / 2;
        var dx = coords.x - cx;
        switch(transition.to) {
            case "dragging":
                return (coords.rx > this.properties.resize_padding && coords.ry > this.properties.resize_padding && coords.rx < this.properties.w - this.properties.resize_padding && coords.ry < this.properties.h - this.properties.resize_padding);
            case "resize_left":
                return (coords.rx > -this.properties.resize_padding && coords.rx < this.properties.resize_padding && coords.ry > 0 && coords.ry < this.properties.h);
            case "resize_right":
                return (coords.rx > this.properties.w - this.properties.resize_padding && coords.rx < this.properties.w + this.properties.resize_padding && coords.ry > 0 && coords.ry < this.properties.h);
            case "resize_top":
                return (coords.ry > - this.properties.resize_padding && coords.ry < this.properties.resize_padding && coords.rx > 0 && coords.rx < this.properties.w);
            case "resize_bottom":
                return (coords.ry > this.properties.h - this.properties.resize_padding && coords.ry < this.properties.h + this.properties.resize_padding && coords.rx > 0 && coords.rx < this.properties.w);
        }
    },
});
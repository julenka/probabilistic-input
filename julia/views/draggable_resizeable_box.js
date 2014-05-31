/**
 * Created by julenka on 5/24/14.
 */

// TODO: This depends on Julia. Figure out how to specify this.


/**
 * A rectangle that is draggable
  * @type {*}
 */
var DraggableBox = FSMView.subClass({
    className: "DraggableBox",
    init: function (julia, x, y, w, h, handles_event) {
        this._super(julia);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        // {mouse_x, mouse_y, my_x, my_y}
        this.drag_start_info= {};
        this.current_state = "start";
        this.drag_sample_index = -1;
        this.color = "#444444";

        // TODO: make it easy to apply common properties
        this.fsm_description = {
            start: [
                //   init: function(to, sample_index_matches, feedback_action, final_action, handles_event) {
                new MouseDownTransition(
                    "dragging",
                    this.hit_test,
                    this.drag_start,
                    undefined,
                    true)
            ],
            dragging: [
                new MouseMoveTransition(
                    "dragging",
                    this.sample_index_matches,
                    this.drag_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition(
                    "start",
                    this.sample_index_matches,
                    undefined,
                    this.drag_end,
                    true
                )
            ]
        };
    },
    copyProperties: function(clone) {
        clone.color = this.color;
        clone.drag_start_info = shallowCopy(this.drag_start_info);
        clone.drag_sample_index = this.drag_sample_index;
    },
    get_relative: function(e) {
        var rx = e.element_x - this.x;
        var ry = e.element_y - this.y;
        return {rx: rx, ry: ry};
    },
    get_relative_motion: function(e) {
        return {
            dx:e.element_x - this.drag_start_info.mouse_x,
            dy:e.element_y - this.drag_start_info.mouse_y
        };
    },
    hit_test: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > 0 && coords.ry > 0 && coords.rx < this.w && coords.ry < this.h);
    },
    sample_index_matches: function(e) {
        return e.sample_index === this.drag_sample_index;
    },
    /**
     * Called when a gesture (e.g. the drag, in this case) starts.
     * Store information about the start of the gesture here.
     * @param e
     */
    gesture_start: function(e) {
        this.drag_sample_index = e.sample_index;
        this.drag_start_info.mouse_x = e.element_x;
        this.drag_start_info.mouse_y = e.element_y;
        this.drag_start_info.my_x = this.x;
        this.drag_start_info.my_y = this.y;
        this.drag_start_info.my_w = this.w;
        this.drag_start_info.my_h = this.h;
    },
    drag_start: function(e, rootView) {
        // the index of the event sample that we received when a drag was initiated
        this.gesture_start(e);
    },
    drag_progress: function(e, rootView) {
        var motion = this.get_relative_motion(e);
        this.x = this.drag_start_info.my_x + motion.dx;
        this.y = this.drag_start_info.my_y + motion.dy;
    },
    drag_end: function(e, rootView) {
        this.drag_sample_index = -1;
    },
    draw: function ($el) {
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        if(this.current_state == "dragging") {
            var padding = 5;
            s.rect(this.x - padding, this.y - padding, this.w + 2 * padding, this.h + 2 * padding)
                .attr({fill: "white", "stroke-width": 1, stroke: "black"});
        }
        s.rect(this.x, this.y, this.w, this.h).attr({fill: this.color});
    },
    drawAmbiguous: function($el) {
        this.draw($el);
        var s = Snap($el[0]);
        var x = this.x + this.w / 2 - 12;
        var y = this.y + this.h / 2 + 24;
        s.text(x, y, "?").attr({'font-family':'Arial, Helvetical', 'font-size': '48px', opacity: 0.5});
    },
    clone: function() {
        var result = new DraggableBox(this.julia, this.x, this.y, this.w, this.h);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        this.copyProperties(result);
        return result;
    },

    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.x === other.x && this.y === other.y;
    }
});

/**
 * A rectangle that is draggable and resizeable
 * @type {*}
 */
var DraggableResizeableBox = DraggableBox.subClass({
    className: "DraggableResizeableBox",
    init: function (julia, x, y, w, h, resize_padding) {
        this._super(julia, x, y, w, h);
        // resize padding is the padding size for becoming resizeable
        this.resize_padding = resize_padding;
        this.min_h = 10;
        this.min_w = 10;

        var new_states = ["resize_left", 'resize_top', "resize_right", "resize_bottom"];
        for(var i = 0; i < new_states.length; i++) {
            var name = new_states[i];
            this.fsm_description.start.push(
                new MouseDownTransition(
                    name,
                    this.hit_test,
                    this.drag_start,
                    undefined,
                    true)
            );
            this.fsm_description[name] = [
                new MouseMoveTransition(
                    name,
                    this.sample_index_matches,
                    this.drag_progress,
                    undefined,
                    true
                ), new MouseUpTransition(
                    "start",
                    this.sample_index_matches,
                    undefined,
                    this.drag_end,
                    true
                )
            ];

        }
    },
    copyProperties: function(result) {
        this._super(result);
        result.min_h = this.min_h;
        result.min_w = this.min_w;
    },
    drag_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_w = this.w;
        var new_h = this.h;
        var new_x = this.x;
        var new_y = this.y;
        switch(this.current_state) {
            case "dragging":
                new_x = this.drag_start_info.my_x + motion.dx;
                new_y = this.drag_start_info.my_y + motion.dy;
                break;
            case "resize_left":
                new_w = this.w = this.drag_start_info.my_w - motion.dx;
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
        if(new_h < this.min_h) { return; }
        if(new_w < this.min_w) { return; }
        this.x = new_x;
        this.y = new_y;
        this.w = new_w;
        this.h = new_h;
    },
    hit_test: function(e, transition) {
        var coords = this.get_relative(e);
        switch(transition.to) {
            case "dragging":
                return (coords.rx > this.resize_padding && coords.ry > this.resize_padding && coords.rx < this.w - this.resize_padding && coords.ry < this.h - this.resize_padding);
            case "resize_left":
                return (coords.rx > -this.resize_padding && coords.rx < this.resize_padding && coords.ry > 0 && coords.ry < this.h);
            case "resize_right":
                return (coords.rx > this.w - this.resize_padding && coords.rx < this.w + this.resize_padding && coords.ry > 0 && coords.ry < this.h);
            case "resize_top":
                return (coords.ry > - this.resize_padding && coords.ry < this.resize_padding && coords.rx > 0 && coords.rx < this.w);
            case "resize_bottom":
                return (coords.ry > this.h - this.resize_padding && coords.ry < this.h + this.resize_padding && coords.rx > 0 && coords.rx < this.w);
        }
    },
    draw: function ($el) {
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        var padding = 5;
        var border_attrs = {fill: "white", "stroke-width": 1, stroke: "black"};
        if(this.current_state === "dragging") {
            s.rect(this.x - padding, this.y - padding, this.w + 2 * padding, this.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_left") {
            s.rect(this.x - padding, this.y - padding, 2 * padding, this.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_right") {
            s.rect(this.x + this.w - padding, this.y - padding, 2 * padding, this.h + 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_top") {
            s.rect(this.x - padding, this.y - padding, this.w + 2 * padding, 2 * padding)
                .attr(border_attrs);
        } else if (this.current_state === "resize_bottom") {
            s.rect(this.x - padding, this.y + this.h - padding, this.w + 2 * padding, 2 * padding)
                .attr(border_attrs);
        }
        s.rect(this.x, this.y, this.w, this.h).attr({fill: this.color});
    },
    clone: function() {
        var result = new DraggableResizeableBox(this.julia, this.x, this.y, this.w, this.h, this.resize_padding);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        this.copyProperties(result);
        return result;
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.w === other.w && this.h === other.h;
    }
});

/**
 * A rectangle that is draggable and resizeable, however it uses the motion at the beginning of the interaction
 * to disambiguate the user's intention.
 * If resizing horizontally, only horizontal motions are accepted
 * If resizing vertically, only vertical motions are accepted
 * If dragging, only diagonal motions are accepted
 * @type {*}
 */
var DraggableResizeableBox2 = DraggableResizeableBox.subClass({
    className: "DraggableResizeableBox2",
    init: function(julia, x, y, w, h, resize_padding) {
        this._super(julia, x, y, w, h, resize_padding);
    },
    clone: function() {
        var result = new DraggableResizeableBox2(this.julia, this.x, this.y, this.w, this.h, this.resize_padding);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        this.copyProperties(result);
        return result;
    },
    drag_progress: function(e) {
        this._super(e);
        var dx = Math.abs(this.drag_start_info.mouse_x - e.element_x);
        var dy = Math.abs(this.drag_start_info.mouse_y - e.element_y);
        // TODO: this should be resolution independent, and should have to do with probabilities...
        if(this.resizingHorizontally() && dy > 30) {
            this.current_state = "dragging";
            this.w = this.drag_start_info.my_w;
            this.h = this.drag_start_info.my_h;
        } else if (this.resizingVertically() && dx > 30) {
            this.current_state = "dragging";
            this.w = this.drag_start_info.my_w;
            this.h = this.drag_start_info.my_h;
        }

    },
    resizingVertically: function() { return this.current_state === "resize_top" || this.current_state === "resize_bottom";},
    resizingHorizontally: function() { return this.current_state === "resize_left" || this.current_state === "resize_right";},
    /**
     * returns the angle between two vectors, in degrees
     * @param v1
     * @param v2
     */
    getAngle: function(v1, v2) {
        var dot = v1.x * v2.x + v1.y * v2.y;
        if(dot === 0){ return 0; }
        var v1mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        var v2mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        var radians = Math.acos(dot / v1mag * v2mag );
        return radians / Math.PI * 180;
    },
    moveToQuadrant: function(v1) {
        return {x: Math.abs(v1.x), y: Math.abs(v1.y)};
    },
    drag_start: function(e) {
        this._super(e);
        this.drag_points = [];
    }
});
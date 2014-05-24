/**
 * Created by julenka on 5/24/14.
 */

// TODO: This depends on Julia. Figure out how to specify this.
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
                //   init: function(to, predicate, feedback_action, final_action, handles_event) {
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
                    this.does_sample_index_match,
                    this.drag_progress,
                    undefined,
                    true
                ),
                new MouseUpTransition(
                    "start",
                    this.does_sample_index_match,
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
    does_sample_index_match: function(e) {
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

var DraggableResizeableBox = DraggableBox.subClass({
    className: "DraggableResizeableBox",
    init: function (julia, x, y, w, h, resize_padding) {
        this._super(julia, x, y, w, h);
        // resize padding is the padding size for becoming resizeable
        this.resize_padding = resize_padding;
        this.min_h = 10;
        this.min_w = 10;
        var dragEndTransition = new MouseUpTransition(
            "start",
            this.does_sample_index_match,
            undefined,
            this.drag_end,
            true
        );
        $.extend(this.fsm_description,
            {
                resize_left: [
                    new MouseMoveTransition(
                        "resize_left",
                        this.does_sample_index_match,
                        this.resize_left_progress,
                        undefined,
                        true
                    ),
                    dragEndTransition
                ],
                resize_top: [
                    new MouseMoveTransition(
                        "resize_top",
                        this.does_sample_index_match,
                        this.resize_top_progress,
                        undefined,
                        true
                    ),
                    dragEndTransition
                ],
                resize_right: [
                    new MouseMoveTransition(
                        "resize_right",
                        this.does_sample_index_match,
                        this.resize_right_progress,
                        undefined,
                        true
                    ),
                    dragEndTransition
                ],
                resize_bottom: [
                    new MouseMoveTransition(
                        "resize_bottom",
                        this.does_sample_index_match,
                        this.resize_bottom_progress,
                        undefined,
                        true
                    ),
                    dragEndTransition
                ]
            }
        );

        this.fsm_description.start.extend([
            new MouseDownTransition(
                "resize_left",
                this.hit_test_left_edge,
                this.drag_start,
                undefined,
                true),
            new MouseDownTransition(
                "resize_right",
                this.hit_test_right_edge,
                this.drag_start,
                undefined,
                true),
            new MouseDownTransition(
                "resize_top",
                this.hit_test_top_edge,
                this.drag_start,
                undefined,
                true),
            new MouseDownTransition(
                "resize_bottom",
                this.hit_test_bottom_edge,
                this.drag_start,
                undefined,
                true)
        ]
        );
    },
    copyProperties: function(result) {
        this._super(result);
        result.min_h = this.min_h;
        result.min_w = this.min_w;
    },
    hit_test: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > this.resize_padding && coords.ry > this.resize_padding && coords.rx < this.w - this.resize_padding && coords.ry < this.h - this.resize_padding);
    },
    hit_test_left_edge: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > -this.resize_padding && coords.rx < this.resize_padding && coords.ry > 0 && coords.ry < this.h);
    },
    hit_test_right_edge: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > this.w - this.resize_padding && coords.rx < this.w + this.resize_padding && coords.ry > 0 && coords.ry < this.h);
    },
    hit_test_top_edge: function(e) {
        var coords = this.get_relative(e);
        return (coords.ry > - this.resize_padding && coords.ry < this.resize_padding && coords.rx > 0 && coords.rx < this.w);
    },
    hit_test_bottom_edge: function(e) {
        var coords = this.get_relative(e);
        return (coords.ry > this.h - this.resize_padding && coords.ry < this.h + this.resize_padding && coords.rx > 0 && coords.rx < this.w);
    },
    resize_top_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_h = this.drag_start_info.my_h - motion.dy;
        if(new_h < this.min_h) { return;}
        this.y = this.drag_start_info.my_y + motion.dy;
        this.h = new_h;
    },
    resize_bottom_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_h = this.drag_start_info.my_h + motion.dy;;
        if(new_h < this.min_h) { return; }
        this.h = new_h;
    },
    resize_left_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_w = this.w = this.drag_start_info.my_w - motion.dx;;
        if(new_w < this.min_w) { return; }
        this.w = new_w;
        this.x = this.drag_start_info.my_x + motion.dx;

    },
    resize_right_progress: function(e) {
        var motion = this.get_relative_motion(e);
        var new_w = this.drag_start_info.my_w + motion.dx;
        if(new_w < this.min_w) { return; }
        this.w = new_w;
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
/**
 * Created by julenka on 8/13/14.
 */


/**
 * Represents an object that can be dragged
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
        var this_defaults = {
                color:"#444444",
                "stroke-width": 0,
                stroke: "black",
                x: 0, y: 0, w: 0, h: 0,
                default_predicate_probability: 0.6,
                default_predicate_probability_with_prior: 1.0
            };
        $.extend(this_defaults, defaults);
        this._super(julia, properties, this_defaults);
        // {mouse_x, mouse_y, my_x, my_y}
        this.drag_start_info= {};

        this.fsm_description = {
            start: [
                //   init: function(to, drag_predicate, feedback_action, final_action, handles_event) {
                new MouseDownTransitionWithProbability(
                    "dragging",
                    this.predicate_drag_start,
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
                    this.drag_end_predicate,
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
    predicate_drag_start: function(e, transition) {
        if(this.hit_test(e, transition)) {
            return this.properties.default_predicate_probability;
        }
        return 0;
    },
    hit_test: function(e) {
        var coords = this.get_relative(e);
        return (coords.rx > 0 && coords.ry > 0 && coords.rx < this.properties.w && coords.ry < this.properties.h);
    },
    send_drag_start: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragStartEvent(this));
    },
    /**
     * When the drag is starting, we need to also add a drag event to the current dispatch queue
     * @param e
     */
    drag_end_predicate: function(e) {
        return 1;
    },
    drag_predicate: function(e) {
        return 1;
    },
    send_drag_end: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragEndEvent(this));
    },
    send_drag_progress: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragProgressEvent(this));
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
        this.send_drag_start(e);
    },
    drag_progress: function(e, rootView) {
        var motion = this.get_relative_motion(e);
        this.properties.x = this.drag_start_info.my_x + motion.dx;
        this.properties.y = this.drag_start_info.my_y + motion.dy;
        this.send_drag_progress();
    },
    drag_end: function() {
        this.send_drag_end();
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
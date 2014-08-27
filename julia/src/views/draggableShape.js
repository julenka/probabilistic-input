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
                //   init: function(to, predicateDragProgress, feedback_action, final_action, handles_event) {
                new MouseDownTransitionWithProbability(
                    "dragging",
                    this.predicateStartDrag,
                    this.updateStartDrag,
                    undefined,
                    true)
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
                    this.onDragEnd_predicate,
                    undefined,
                    this.onDragEnd,
                    true
                )
            ]
        };
    },
    getRelative: function(e) {
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y;
        return {rx: rx, ry: ry};
    },
    getRelativeMotion: function(e) {
        return {
            dx:e.base_event.element_x - this.drag_start_info.mouse_x,
            dy:e.base_event.element_y - this.drag_start_info.mouse_y
        };
    },
    predicateStartDrag: function(e, transition) {
        if(this.hitTest(e, transition)) {
            return this.properties.default_predicate_probability;
        }
        return 0;
    },
    hitTest: function(e) {
        var coords = this.getRelative(e);
        return (coords.rx > 0 && coords.ry > 0 && coords.rx < this.properties.w && coords.ry < this.properties.h);
    },
    sendUpdateStartDrag: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragStartEvent(this));
    },
    /**
     * When the drag is starting, we need to also add a drag event to the current dispatch queue
     * @param e
     */
    onDragEnd_predicate: function(e) {
        return 1;
    },
    predicateDragProgress: function(e) {
        return 1;
    },
    sendOnDragEnd: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragEndEvent(this));
    },
    sendUpdateDragProgress: function() {
        this.julia.addToDispatchQueue({view: this.getRootView(), probability: 1},new DragProgressEvent(this));
    },
    /**
     * Called when a gesture (e.g. the drag, in this case) starts .
     * Store information about the start of the gesture here.
     * @param e
     */
    gestureStart: function(e) {
        this.drag_start_info.mouse_x = e.base_event.element_x;
        this.drag_start_info.mouse_y = e.base_event.element_y;
        this.drag_start_info.my_x = this.properties.x;
        this.drag_start_info.my_y = this.properties.y;
        this.drag_start_info.my_w = this.properties.w;
        this.drag_start_info.my_h = this.properties.h;
    },
    updateStartDrag: function(e, rootView) {
        // the index of the event sample that we received when a drag was initiated
        this.gestureStart(e);
        this.sendUpdateStartDrag(e);
    },
    updateDragProgress: function(e, rootView) {
        var motion = this.getRelativeMotion(e);
        this.properties.x = this.drag_start_info.my_x + motion.dx;
        this.properties.y = this.drag_start_info.my_y + motion.dy;
        this.sendUpdateDragProgress();
    },
    onDragEnd: function() {
        this.sendOnDragEnd();
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
        result.drag_start_info = deepCopy(this.drag_start_info);
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
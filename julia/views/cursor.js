/**
 * Created by julenka on 7/15/14.
 */
var Cursor = FSMView.subClass({
    className: "Cursor",
    /**
     * A simple cursor. Properties are:
     * x:
     * y:
     * radius:
     * opacity:
     * drag_sample_index:
     * handles_event:
     * @param julia
     * @param properties
     */
    init: function (julia, properties) {
        var defaults = {
            color: "black",
            x: 0,
            y: 0,
            opacity: 1.0,
            radius: 10,
            drag_sample_index: -1,
            handles_event: false
        };
        this._super(julia, properties, defaults);
        var t = function() { return true; };
        // TODO: make it easy to apply common properties
        this.fsm_description = {
            start: [
                new MouseDownTransition(
                    "down",
                    t,
                    this.drag_start,
                    undefined,
                    this.handles_event),
                new MouseMoveTransition(
                    "start",
                    t,
                    this.update_location,
                    undefined,
                    this.handles_event)
            ],
            down: [
                new MouseMoveTransition(
                    "down",
                    this.does_sample_index_match,
                    this.drag_progress,
                    undefined,
                    this.handles_event
                ),
                new MouseUpTransition(
                    "start",
                    this.does_sample_index_match,
                    this.drag_end,
                    undefined,
                    this.handles_event
                )
            ]
        };
    },
    does_sample_index_match: function(e) {
        return e.sample_index === this.properties.drag_sample_index;
    },
    update_location: function(e, rootView){
        this.properties.x = e.element_x;
        this.properties.y = e.element_y;
    },
    drag_start: function(e, rootView) {
        // the index of the event sample that we received when a drag was initiated
        this.properties.drag_sample_index = e.sample_index;
        this.update_location(e);
        this.properties.color = "green";
    },
    drag_progress: function(e, rootView) {
        this.update_location(e);
    },
    drag_end: function(e, rootView) {
        this.update_location(e);
        this.properties.color = "black";
        this.properties.drag_sample_index = -1;
    },
    draw: function ($el) {
        // TODO are we okay with drawing this to a Snap?
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        s.circle(this.properties.x, this.properties.y, this.properties.radius)
            .attr({fill: this.properties.color, opacity: this.properties.opacity});
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.properties.x === other.properties.x && this.properties.y === other.properties.y;
    }
});

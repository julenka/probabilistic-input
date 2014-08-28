/**
 * Created by julenka on 8/13/14.
 */

/**
 * Drag out a bounding box containing one of two shapes: circles or rectangles
 */
var DragShapeView = FSMView.subClass({
    className: "DragShapeView",
    init: function(julia, props) {
        var defaults = {
            fill: "white",
            stroke: "black",
            onShapeCompleted: function(shape, view) { log(LOG_LEVEL_DEBUG, "shape", shape, "completed"); }
        };
        this._super(julia, props, defaults);
        this.initFSM();
    },
    initFSM: function() {
        this.fsm_description = { start: []};
        var shapes = ["circle", "rectangle"];
        var me = this;
        shapes.forEach(function(shape) {
            var start_shape = new MouseDownTransition(
                shape,
                RETURN_TRUE,
                me.updateStart,
                undefined,
                true
            );
            me.fsm_description.start.push(start_shape);
            var shape_shape = new MouseMoveTransition(
                shape,
                RETURN_TRUE,
                me.updateBounds,
                undefined,
                true
            );
            me.fsm_description[shape] = [];
            me.fsm_description[shape].push(shape_shape);
            var shape_start = new MouseUpTransition(
                "start",
                function() { return this.properties.p1 && this.properties.p2; },
                undefined,
                me.shapeDone.curry(shape),
                true
            );
            me.fsm_description[shape].push(shape_start);
            if(!me.properties.initialized) {
                me.julia.model.addEquivalentTransitions(shape_start.__julia_transition_id, start_shape.__julia_transition_id);
//                me.julia.model.addEquivalentTransitions(shape_start.__julia_transition_id, shape_shape.__julia_transition_id);
            }

        });
        me.properties.initialized = true;
    },
    updateStart: function(e) {
        this.attr({p1: {x: e.base_event.element_x, y: e.base_event.element_y}});
    },
    updateBounds: function(e) {
        this.attr({p2: {x: e.base_event.element_x, y: e.base_event.element_y}});
    },
    draw: function($el) {
        var s = Snap($el[0]);
        var attrs = {
            fill: this.properties.fill,
            opacity: 0.5,
            stroke: this.properties.stroke
        };
        var p1 = this.properties.p1;
        var p2 = this.properties.p2;
        if(!p1 || !p2) {
            return;
        }
        // top left
        var tl = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
        // bottom right
        var br = {x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y)};
        var w = br.x - tl.x;
        var h = br.y - tl.y;
        if(this.current_state === "circle") {
            s.ellipse(tl.x + w/2, tl.y + h/2, w/2, h/2).attr(attrs);
        } else {
            // current_state === "rect"
            s.rect(tl.x, tl.y, w, h).attr(attrs);
        }
    },
    shapeDone: function(shape, e, rootView) {
        var p1 = this.properties.p1;
        var p2 = this.properties.p2;
        // top left
        var tl = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
        // bottom right
        var br = {x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y)};
        this.properties.onShapeCompleted(shape, rootView, tl, br);
        delete this.properties.p1;
        delete this.properties.p2;
    }
});

/**
 * Created by julenka on 8/6/14.
 */

var EditableLine = DraggableShape.subClass({
    className: "EditableLine",
    init: function(julia, p1, p2, props) {
        if(!props){
            props = {};
        }
        var defaults = {
            ctrl_pt_radius: 20
        };
        props.p1 = p1;
        props.p2 = p2;
        this._super(julia, props, defaults);
        this.initFSM();
    },
    initFSM: function() {
        // fsm already has start, dragging states
        this.fsm_description.start.push(
            new MouseMoveTransition(
                "over",
                this.overPredicate,
                function(){},
                undefined,
                false
            )
        );
        this.fsm_description.over = [
                new MouseMoveTransition(
                    "start",
                    function(e) { return !this.overPredicate(e);},
                    function(){},
                    undefined,
                    true
                ),
            new MouseDownTransition(
                "dragging",
                this.predicate_drag_start,
                this.drag_start,
                undefined,
                true)
            ];
        this.fsm_description.move_p1 = [];
        this.fsm_description.move_p2 = [];

        var me = this;
        var new_states = ["move_p1", "move_p2"];
        new_states.forEach(function(state){
            me.fsm_description.start.push(
                new MouseDownTransitionWithProbability(
                    state,
                    me.hitTestControlPoint,
                    function(){},
                    undefined,
                    true
                )
            );
            me.fsm_description.over.push(
                new MouseDownTransitionWithProbability(
                    state,
                    me.hitTestControlPoint,
                    function(){},
                    undefined,
                    true
                )
            );
            me.fsm_description[state].push(
                new MouseMoveTransition(
                    state,
                    RETURN_TRUE,
                    me.updatePoints,
                    undefined,
                    true
                )
            );
            me.fsm_description[state].push(
                new MouseUpTransition(
                    "start",
                    RETURN_TRUE,
                    undefined,
                    function() {},
                    true
                )
            );
        });
    },
    /**
     * Override the Draggable's gesture start method, we
     * need to record our own information
     * @param e
     */
    gesture_start: function(e){

        this.drag_start_info.mouse_x = e.base_event.element_x;
        this.drag_start_info.mouse_y = e.base_event.element_y;
        this.drag_start_info.p1 = shallowCopy(this.properties.p1);
        this.drag_start_info.p2 = shallowCopy(this.properties.p2);
    },
    /**
     * Need to override the Draggable gesture progress function
     * to update endpoints
     * @param e
     */
    drag_progress: function(e) {
        var dx = e.base_event.element_x - this.drag_start_info.mouse_x;
        var dy = e.base_event.element_y - this.drag_start_info.mouse_y;
        this.properties.p1.x = this.drag_start_info.p1.x + dx;
        this.properties.p1.y = this.drag_start_info.p1.y + dy;
        this.properties.p2.x = this.drag_start_info.p2.x + dx;
        this.properties.p2.y = this.drag_start_info.p2.y + dy;
        this.send_drag_progress();
    },
    getBoundingBox: function() {
        var p1 = this.properties.p1;
        var p2 = this.properties.p2;
        return {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y),
            w: Math.abs(p2.x - p1.x), h: Math.abs(p2.y - p1.y)};
    },
    /**
     * Override the draggable hit test function
     * @param e
     * @returns {boolean}
     */
    hit_test: function(e) {
        return this.hitTestDrag(e);
    },
    overPredicate: function(e) {
        return this.hitTestControlPoint(e, {to: "move_p1"}) > 0 || this.hitTestControlPoint(e, {to: "move_p2"}) > 0 || this.hitTestRegion(e);
    },
    hitTestDrag: function(e) {
        if(this.hitTestControlPoint(e, {to: "move_p1"}) > 0) {
            return false;
        }
        if(this.hitTestControlPoint(e, {to: "move_p2"}) > 0) {
            return false;
        }
        return this.hitTestRegion(e);
    },
    /**
     * Check if mouse event is within ctrl_pt_radius of the line
     * @param e
     * @returns {boolean}
     */
    hitTestRegion: function(e) {
        // This uses the sylvester library, see: http://sylvester.jcoglan.com/api/vector.html
        var v1 = $V([this.properties.p1.x, this.properties.p1.y]);
        var v2 = $V([this.properties.p2.x, this.properties.p2.y]);
        // Vector from v1 to v2
        var v12 = v2.subtract(v1);
        // c is candidate point
        var c = $V([e.base_event.element_x, e.base_event.element_y]);
        // v1 to c
        var v1c = c.subtract(v1);
        var v2c = c.subtract(v2);
        // The dot is not between p1 and p2
        if(v1c.dot(v2c) > 0) {
            return false;
        }

        // projection of v1c onto v12
        var projv1cv12 = v12.x(v1c.dot(v12) / Math.pow(v12.modulus(),2));
        // c to the projection
        var cproj = projv1cv12.subtract(v1c);
        var dPointToLine = cproj.modulus();
        return dPointToLine < this.properties.ctrl_pt_radius;
    },
    hitTestControlPoint: function(e, transition) {
        var pt = transition.to === "move_p1" ? this.properties.p1 : this.properties.p2;
        var x = e.base_event.element_x;
        var y = e.base_event.element_y;
        var r = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
        if( r < this.properties.ctrl_pt_radius) {
            return 0.8;
        } else {
            return 0;
        }
    },
    updatePoints: function(e) {
        var x = e.base_event.element_x;
        var y = e.base_event.element_y;
        if(this.current_state === "move_p1") {
            this.properties.p1 = {x: x, y: y};
        } else {
            this.properties.p2 = {x: x, y: y};
        }
    },
    drawControlPoints: function($el){
        var s = Snap($el[0]);
        var current_state = this.current_state;
        var r = this.properties.ctrl_pt_radius;
        var control_states = {"move_p1": this.properties.p1, "move_p2": this.properties.p2};
        for(var state in control_states) {
            var p = control_states[state];
            s.circle(p.x, p.y, r).attr({
                fill: current_state === "dragging" ? "green" : state === current_state ? "red": "white",
                opacity: 0.5
            });
        }
    },
    draw: function($el) {
        var p1 = this.properties.p1;
        var p2 = this.properties.p2;
        var s = Snap($el[0]);
        s.line(p1.x, p1.y, p2.x, p2.y).attr({
            stroke: this.properties["color"],
            "stroke-width": this.properties["radius"]
        });

        if(this.current_state !== "start") {
            this.drawControlPoints($el);
        }
        s.text(50,50, this.current_state);
    }

});
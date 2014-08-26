/**
 * Created by julenka on 7/15/14.
 */
/**
 * A simple button. Moving outside of the button while it is down will move button to the start state
 * Properties:
 * x:
 * y:
 * w:
 * h:
 * @type {Button}
 * @param properties list of properties.
 */
var Button = FSMView.subClass({
    className: "Button",
    init: function (julia, properties, defaults) {
        if(!defaults) {
            defaults = {};
        }
        $.extend(defaults,{
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            background_color: 'white',
            over_background_color: 'black',
            text: "button"
        } );
        this._super(julia, properties, defaults);
        this.click_handlers = [];
        // TODO: make it easy to apply common properties
        this.fsm_description = {
            start: [
                new MouseMoveTransitionWithProbability(
                    "over",
                    this.hit_test,
                    this.on_over,
                    undefined,
                    false
                )
            ],
            over: [
                new MouseDownTransition(
                    "down",
                    function() { return true; },
                    this.on_down,
                    undefined,
                    true),

                new MouseMoveTransitionWithProbability(
                    "start",
                    function(e) {
                        return 1 - Math.ceil(this.hit_test(e));
                    },
                    this.on_over_out,
                    undefined,
                    false
                ),
                new MouseMoveTransitionWithProbability(
                    "over",
                    this.hit_test,
                    DO_NOTHING,
                    undefined,
                    true
                )
            ],
            down: [
                new MouseMoveTransitionWithProbability(
                    "start",
                    function(e) {
                        return 1 - Math.ceil(this.hit_test(e));
                    },
                    this.on_out,
                    undefined,
                    false
                ),
                new MouseMoveTransitionWithProbability(
                    "down",
                    this.hit_test,
                    this.on_move_in,
                    undefined,
                    true
                ),
                new MouseUpTransition(
                    "start",
                    function() { return true;},
                    undefined,
                    // on_click is the 'final action' version of this event, and it does final actions
                    // final actions should be appended with the 'final' keywords
                    this.on_click_final,
                    true
                )
            ]
        };
    },
    /* Return whether hit or not as a probability */
    hit_test: function(e) {
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y;
        if(!(rx > 0 && ry > 0 && rx < this.properties.w && ry < this.properties.h)) {
            return 0;
        }
        return 1;
    },
    on_over_out: function() {
        // nop 2
    },
    on_out: function(e) {

    },
    on_over: function(e) {

    },
    on_move_in: function(e) {

    },
    on_down: function(e) {

    },
    on_up: function(e) {

    },
    on_click_final: function(e, rootView) {
        var handled = false;
        var i = 0;
        while(i < this.click_handlers.length && !handled) {
            handled = this.click_handlers[i].call(this, rootView);
            i++;
        }
    },
    draw: function ($el) {
        var c = this.current_state === "start" ? this.properties.background_color : this.properties.over_background_color;
        var c2 = this.current_state === "start" ? "black" : "white";

        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        var x = this.properties.x;
        var y = this.properties.y;
        var w = this.properties.w;
        var h = this.properties.h;
        s.rect(x, y, w, h).attr({stroke: "black", "stroke-width": 3, fill: c});
        s.text(x + w / 2, y + h / 2, this.properties.text)
            .attr({stroke:c2, fill: c2, fontFamily: "Helvetica", "text-anchor": "middle", "alignment-baseline": "middle"});
    },
    clone: function() {
        var result = this._super();
        result.click_handlers.extend(this.click_handlers);
        return result;
    },
    addClickHandler: function(fn) {
        this.click_handlers.push(fn);
    },
    removeClickHandler: function(fn) {
        var index = this.click_handlers.indexOf(fn);
        if(index > -1) {
            this.click_handlers.splice(index,1);
        }
    }
});

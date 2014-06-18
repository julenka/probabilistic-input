/**
 * Created by julenka on 6/17/14.
 */

/**
 * A container (unbounded) that can be scrolled.
 * @type {*}
 */
var ScrollView = ContainerView.subClass({
    className: "ScrollContainer",
    init: function(julia) {
        this._super(julia);
        this.properties.scroll_y = 0;
        this.properties.scroll_down_y = 0;
        this.properties.down_y = 0;
        this.properties.is_scrolling = false;
    },
    startScroll: function(e) {
        this.properties.down_y = e.element_y;
        this.properties.is_scrolling = true;
    },
    updateScroll: function(e) {
        var dy = e.element_y - this.properties.down_y;
        this.properties.scroll_y = this.properties.scroll_down_y + dy;
    },
    endScroll: function(e) {
        this.properties.is_scrolling = false;
        this.properties.scroll_down_y = this.properties.scroll_y;
    },
    dispatchEvent: function(e) {
        if(e.type === "mousedown") {
            if(Math.dieRoll(0.8)) {
                console.log("scroll");
                return this.makeRequest(this.startScroll, e, true);
            } else {
                console.log("pass");
                e.element_y -= this.properties.scroll_y;
                return this._super(e);
            }
        } else if (this.properties.is_scrolling && e.type === "mousemove") {
            return this.makeRequest(this.updateScroll, e, true);
        } else if (this.properties.is_scrolling && e.type === "mouseup") {
            return this.makeRequest(this.endScroll, e, false);
        } else {
            e.element_y -= this.properties.scroll_y;
            return this._super(e);
        }
    },
    makeRequest: function(fn, e, is_reversible) {
        return [new ActionRequestSequence(this, [new ActionRequest(fn, this, is_reversible, true, e)])];
    },
    draw: function($el) {
        var s = Snap($el[0]);
        var g = s.group();
        var m = new Snap.Matrix();
        m.translate(0, this.properties.scroll_y);
        g.attr({transform: m.toString()});
        var i = 0;
        for(i; i < this.children.length; i++) {
            this.children[i].draw($(g.node));
        }
    }
});
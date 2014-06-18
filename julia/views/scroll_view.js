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
        console.log(this.properties.scroll_down_y, e.element_y);
        this.properties.is_scrolling = true;
    },
    updateScroll: function(e) {
        var dy = e.element_y - this.properties.down_y;
        console.log(this.properties.scroll_down_y, e.element_y, dy, this.properties.scroll_y);
        this.properties.scroll_y = this.properties.scroll_down_y + dy;
    },
    endScroll: function(e) {
        this.properties.is_scrolling = false;
        this.properties.scroll_down_y = this.properties.scroll_y;
        console.log(this.properties.scroll_down_y);
    },
    dispatchEvent: function(e) {
        if(e.type === "mousedown") {
            if(Math.dieRoll(0.8)) {
                return this.makeRequest(this.startScroll, e, true);
            } else {
                var e_copy = shallowCopy(e);
                e_copy.element_y -= this.properties.scroll_y;
                return this._super(e_copy);
            }
        } else if (this.properties.is_scrolling && e.type === "mousemove") {
            return this.makeRequest(this.updateScroll, e, true);
        } else if (this.properties.is_scrolling && e.type === "mouseup") {
            return this.makeRequest(this.endScroll, e, false);
        } else {
            var e_copy = shallowCopy(e);
            e_copy.element_y -= this.properties.scroll_y;
            return this._super(e_copy);
        }
    },
    makeRequest: function(fn, e, is_reversible) {
        return [new ActionRequestSequence(this, [new ActionRequest(fn, this, is_reversible, true, e)])];
    },
    draw: function($el) {
        var s = Snap($el[0]);
        var g = s.group();
        var m = new Snap.Matrix();
        s.text(0,20, "" + this.properties.scroll_y);
        m.translate(0, this.properties.scroll_y);
        g.attr({transform: m.toString()});
        var i = 0;
        for(i; i < this.children.length; i++) {
            this.children[i].draw($(g.node));
        }
    }
});
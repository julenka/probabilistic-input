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
        this.properties.down_x = 0;
        this.properties.is_scrolling = false;
        this.properties.scroll_frames = 0;

    },
    startScroll: function(e) {
        this.properties.down_y = e.element_y;
        this.properties.down_x = e.element_x;
        this.properties.last_y = e.element_y;
        this.properties.last_x = e.element_x;
        this.properties.distance_x = 0;
        this.properties.distance_y = 0;
        this.properties.scroll_frames = 0;
        this.properties.is_scrolling = true;
    },
    updateScroll: function(e) {
        var dy = e.element_y - this.properties.down_y;
        this.properties.scroll_y = this.properties.scroll_down_y + dy;
        this.properties.scroll_frames++;
        this.properties.distance_x += Math.abs(e.element_x - this.properties.last_x);
        this.properties.distance_y += Math.abs(e.element_y - this.properties.last_y);
        this.properties.last_x = e.element_x;
        this.properties.last_y = e.element_y;
        this._dirty = true;
    },
    endScroll: function(e) {
        this.properties.is_scrolling = false;
        this.properties.scroll_down_y = this.properties.scroll_y;
    },
    killAlternative: function(e, rootView) {
        rootView.kill = true;
    },
    dispatchEvent: function(e) {

        if(e.type === "mousedown") {
            if(Math.dieRoll(0.7)) {
                return this.makeRequest(this.startScroll, e, true);
            } else {
                var e_copy = shallowCopy(e);
                e_copy.element_y -= this.properties.scroll_y;
                return this._super(e_copy);
            }
        } else if (this.properties.is_scrolling && e.type === "mousemove") {

            if(this.properties.scroll_frames > 1 && Math.abs(this.properties.distance_x) > Math.abs(this.properties.distance_y)
                && Math.dieRoll(0.3)) {
                // If it looks like we're selecting text, then
                // TODO: remove this duplicate code
                var e_copy = shallowCopy(e);
                e_copy.element_y -= this.properties.scroll_y;
                return this._super(e_copy);
            }
            return this.makeRequest(this.updateScroll, e, true);
        }

        else if (this.properties.is_scrolling && e.type === "mouseup") {
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
//        s.text(0,20, "" + this.properties.distance_x + ", " + this.properties.distance_y + ", " + this.properties.scroll_frames);
        m.translate(0, this.properties.scroll_y);
        g.attr({transform: m.toString()});
        var i = 0;
        for(i; i < this.children.length; i++) {
            this.children[i].draw($(g.node));
        }
    }
});
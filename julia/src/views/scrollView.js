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
        var defaults = {
            scroll_y: 0,
            scroll_down_y: 0,
            down_y: 0,
            down_x: 0,
            is_scrolling: false,
            scroll_frames: 0,
            scroll_down_likelihood: 0.55
        };
        // super call format is julia, props
        this._super(julia, defaults);
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
    dispatchEvent: function(e) {
        var result = [];
        var i;
        var me = this;
        function getChildActionRequests (ev, weight) {
            var e_copy = shallowCopy(ev);
            e_copy.element_y -= me.properties.scroll_y;
            var sequences = me._super(e_copy);
            for(i = 0; i < sequences.length; i++) {
                sequences[i].weight *= weight;
            }
            return sequences;
        }
        var likelihood = this.properties.scroll_down_likelihood;
        if(e.type === "mousedown") {
            // Initially it is equally likeliy that we will scroll or dispatch to children
            result.push(this.makeRequest(this.startScroll, e, true, 0.5));
            result.extend(getChildActionRequests(e, 0.5));
        } else if (e.type === "mousemove") {
            if(this.properties.is_scrolling) {
                if(this.scrollCondition()) {
                    // If we are scrolling we know this so return likelihood 1
                    result.push(this.makeRequest(this.updateScroll, e, true, 1));
                } else {
                    // We are probably doing somethign else like selecting text
                    // More likly child requests
                    // otherwise, weight likelihood of text selection more
                    //
                    result.push(this.makeRequest(this.updateScroll, e, true, 1 - likelihood));
                }
            } else {
                result.extend(getChildActionRequests(e, likelihood));
            }

        } else if (e.type === "mouseup") {
            if(this.properties.is_scrolling) {
                result.push(this.makeRequest(this.endScroll, e, false,likelihood));
            } else {
                result.extend(getChildActionRequests(e, likelihood));
            }
        } else {
            throw "invalid input sent to to scrollView: " + e.type;
        }
        return result;
    },
    /**
     * Returns true if it looks like we are scrolling. If so, return action request for scroll of 1
     */
    scrollCondition: function() {
        return this.properties.scroll_frames > 1 && Math.abs(this.properties.distance_y) > Math.abs(this.properties.distance_x);
    },
    makeRequest: function(fn, e, is_reversible, weight) {
        return new ActionRequestSequence(this, [new ActionRequest(fn, this, is_reversible, true, e, weight)], weight);
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
/**
 * Created by julenka on 7/18/14.
 */



var PTouchEventHook = DOMEventSource.subClass({
    className: "PTouchEventHook",
    init: function(el, variance_x_px, variance_y_px) {
        //noinspection JSUnresolvedFunction
        this._super(el);
        this.variance_x_px = variance_x_px;
        this.variance_y_px = variance_y_px;
        this.conversions = { touchstart: 'mousedown', touchmove: 'mousemove', touchend: 'mouseup', touchcancel: 'mouseup' };
    },
    makeMouseEvent: function(e) {
        // ***NOTE*** If we ever update what we do with PMouseEvents, we will need to update this as well
        var pageX, pageY;
        if(e.targetTouches.length == 0) {
            pageX = 0;
            pageY = 0;
        } else {
            pageX = e.targetTouches[0].pageX;
            pageY = e.targetTouches[0].pageY;
        }


        var event = document.createEvent("MouseEvents");
        event.initMouseEvent(this.conversions[e.type], true, true, this.el, 0, pageX, pageY, pageX, pageY,
            false, false, false, false, 0, null);
        return event;
    },
    addListener: function(fn) {
        var me = this;

        // according to http://www.html5rocks.com/en/mobile/touchandmouse/
        // when dealing with svgs, we shoul register a touch down handler, then once this happens, add move handlers,
        // then on touch end remove them
        var touchStartListener = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var event = me.makeMouseEvent(e);

            var moveFn = function(e) {
                var event = me.makeMouseEvent(e);
                fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));
            };
            var endFn = function(e) {
                var event = me.makeMouseEvent(e);
                fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));

                me.el.removeEventListener("touchmove", moveFn);
                me.el.removeEventListener(endFn);
            };
            // add move, end event handlers to this.el
            e.target.addEventListener("touchmove", moveFn);
            e.target.addEventListener("touchend", endFn);
            e.target.addEventListener("touchcancel", endFn);

            fn(new PMouseEvent(1, event, me.variance_x_px, me.variance_y_px, me.conversions[e.type], me.el));
        };
        this.el.addEventListener("touchstart", touchStartListener);
        me.event_listeners.push({type: "touchstart", fn: touchStartListener});
    }
});

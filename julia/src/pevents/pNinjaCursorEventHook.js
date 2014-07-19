/**
 * Created by julenka on 7/18/14.
 */



var PNinjaCursorEventHook = DOMEventSource.subClass({
    className: "PNinjaCursorEventHook",
    /**
     * Captures mouse events on a DOM element and generated PMouseEvents (probabilistic mouse events)
     * @param el
     * @param variance_x_px x variance. Default is 10
     * @param variance_y_px y variance. Default is 10
     */
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
    },
    addListener: function(fn) {
        var me = this;
        var $el = $(this.el);
        ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(type) {
            var fn2 = function(e) {
                fn(new PNinjaCursorEvent(1, e, type, $el.width(), $el.height(), e.currentTarget));
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});

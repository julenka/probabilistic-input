/**
 * Created by julenka on 7/18/14.
 */


var PMouseEventHook = DOMEventSource.subClass({
    className: "PMouseEventHook",
    /**
     * Captures mouse events on a DOM element and generated PMouseEvents (probabilistic mouse events)
     * @param el
     * @param variance_x_px x variance. Default is 10
     * @param variance_y_px y variance. Default is 10
     */
    init: function(el, variance_x_px, variance_y_px) {
        //noinspection JSUnresolvedFunction
        this._super(el);
        this.variance_x_px = valueOrDefault(variance_x_px, 10);
        this.variance_y_px = valueOrDefault(variance_y_px, 10);
    },
    addListener: function(fn) {
        var me = this;

        ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(type) {
            var fn2 = function(e) {
                fn(new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px, type, e.currentTarget));
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});
/**
 * Created by julenka on 7/18/14.
 */

var PKeyEventHook = DOMEventSource.subClass({
    className: "PKeyEventHook",
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
    },
    addListener: function(fn) {
        var me = this;
        ['keydown', 'keyup', 'keypress'].forEach(function(type) {
            var fn2 = function(e) {
                var now = new Date().getTime();
                fn(new PKeyEvent(1, e));
                if(type === 'keypress') {
                    e.preventDefault();
                }
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);

        });
    }
});

var PCapKeyEventHook = PKeyEventHook.subClass({
    className: "PCapKeyEventHook",
    init: function(el) {
        //noinspection JSUnresolvedFunction
        this._super(el);
        this.last_keypress_time = new Date().getTime();
    },
    addListener: function(fn) {
        var me = this;
        ['keydown', 'keyup', 'keypress'].forEach(function(type) {
            var fn2 = function(e) {
                var now = new Date().getTime();
                fn(new PCapKeyEvent(1, e, now - me.last_keypress_time));
                if(type === 'keypress') {
                    me.last_keypress_time = now;
                    e.preventDefault();
                }

            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});

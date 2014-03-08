/**
 * Created by julenka on 3/5/14.
 */

// *** This code requires event_hook.js ***
// *** This code requires jquery.js ***
// *** This code requires utils.js ***
// *** This code requires pevent.js ***
// TODO: use require.js or something like this

"use strict"

PEventHook.ALL_EVENT_TYPES = ['mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'click', 'keypress'];
function PEventHook(el, fn, event_types) {
    if (typeof event_types == 'undefined') {
        event_types = PEventHook.ALL_EVENT_TYPES;
    }
    this.variance_x_px = 100;
    this.variance_y_px = 100;
    this.event_types = event_types;
    var me = this;
    var dispatchEvent = function(e) {
        var type = e.type;
        if(me.event_types.indexOf(type) === -1) {
            return;
        }
        var pEvent;
        if(type === "click" || type === "mousedown" || type === "mousemove" || type === "mouseup") {
            pEvent = new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px);
        } else {
            pEvent = new PEvent(1, e);
        }
        fn(pEvent);
    };

    if(typeof el === 'undefined') {
        el = window;
    }
    PEventHook.ALL_EVENT_TYPES.forEach(function (type) {
        el.addEventListener(type, dispatchEvent, true);
    });
}

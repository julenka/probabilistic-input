/**
 * Created by julenka on 7/18/14.
 */


var PKeyEvent = PEvent.subClass({
    className: "PKeyEvent",
    init: function(identity_p, e) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.keyCode = e.keyCode;
        this.source="keyboard";
        this.type = e.type;
    },
    getSamples: function() {
        return [new PKeyEvent(1, this.base_event)];
    }
});

var PCapKeyEvent = PKeyEvent.subClass({
    className: "PCapKeyEvent",
    init: function(identity_p, e, time_since_last_keypress) {
        this._super(identity_p, e);
        this.time_since_last_keypress = time_since_last_keypress;
    },
    getSamples: function() {
        if(this.time_since_last_keypress > 1000) {
            var e = this.base_event;
            var upper = String.fromCharCode(e.keyCode).toUpperCase().charCodeAt(0);
            // http://stackoverflow.com/questions/6406784/initkeyevent-keypress-only-works-in-firefox-need-a-cross-browser-solution
            var new_event = document.createEvent("KeyboardEvent");
            Object.defineProperty(new_event, 'keyCode', {
                get : function() {
                    return this.keyCodeVal;
                }
            });
            Object.defineProperty(new_event, 'which', {
                get : function() {
                    return this.keyCodeVal;
                }
            });
            new_event.initKeyboardEvent(e.type, e.bubbles, e.cancelable,
                null, false, false, true, false, upper, upper );
            new_event.keyCodeVal = upper;
            return [new PKeyEvent(0.5, new_event), new PKeyEvent(0.5, this.base_event)];
        }
        return [new PKeyEvent(1, this.base_event)];
    }
});
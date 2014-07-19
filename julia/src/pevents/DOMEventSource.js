/**
 * Created by julenka on 7/18/14.
 */

var DOMEventSource = PEventSource.subClass({
    className: "DOMEventSource",
    init: function(el){
        //noinspection JSUnresolvedVariable
        this.el = el === undefined ? window : el;
        this.event_listeners = [];
    },
    removeEventListeners: function() {
        var me = this;
        this.event_listeners.forEach(function(lt) {
            me.el.removeEventListener(lt.type, lt.fn);
        });
    }
});

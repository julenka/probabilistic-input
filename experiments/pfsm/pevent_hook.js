/**
 * Created by julenka on 3/5/14.
 */

// *** This code requires event_hook.js ***
// *** This code requires jquery.js ***
// *** This code requires utils.js ***
// TODO: use require.js or something like this

"use strict"

var PEvent = Object.subClass({
    init: function (identity_p, e) {
        this.identity_p = identity_p;
        // base event is the event that this probabilsitic event was generated from.
        // seems useful, not sure. Maybe it can be either a regular DOM event or
        this.base_event = e;
    },
    getSamples: function (n) {
        throw({name: "FatalError", message: "PEvent.getSamples is not implemented!"});
    }
});

// TODO: should have PMouse and PKeyboard extend PEvent, implement probability property
// TODO: organize into files
var PMouseEvent = PEvent.subClass({
    init: function (identity_p, e, sigma_x, sigma_y) {
        this._super(identity_p, e);
        this.sigma_x = sigma_x;
        this.sigma_y = sigma_y;
        this.type = e.type;
        this.source = "mouse";
    },
    getSamples: function (n) {
        var left = this.base_event.currentTarget.offsetLeft;
        var top = this.base_event.currentTarget.offsetTop;
        var result = [];
        for (var i = 0; i < n; i++) {
            var sample_x = Math.sampleFromGaussian(this.sigma_x);
            var sample_y = Math.sampleFromGaussian(this.sigma_y);
            result.push(new PMouseEventSample(1 / n, this,
                this.base_event.clientX + sample_x,
                this.base_event.clientY + sample_y,
                this.base_event.clientX + sample_x - left,
                this.base_event.clientY + sample_y - top));
        }
        return result;
    }
});

var PMouseEventSample = PEvent.subClass({
    init: function (identity_p, e, client_x, client_y, element_x, element_y) {
        this._super(identity_p, e);
        this.client_x = client_x;
        this.client_y = client_y;
        this.element_x = element_x;
        this.element_y = element_y;
        this.type = e.type;
    }
});

// when document is ready, set up the PEvent handlers
var PEventHook = Object.subClass({
    init: function (el) {
        this.listeners = [];
        this.variance_x_px = 100;
        this.variance_y_px = 100;
        var eventHook = new EventHook(el);
        var me = this;
        eventHook.addEventListener(function(e) {
            var type = e.type;
            var pEvent;
            if(type === "click" || type === "mousedown" || type === "mousemove" || type === "mouseup") {
                pEvent = new PMouseEvent(1, e, me.variance_x_px, me.variance_y_px);
            } else {
                pEvent = new PEvent(1, e);
            }
            me.listeners.forEach(function(fn) {
                fn(pEvent);
            });
        });
    },
    addEventListener: function(f) {
        this.listeners.push(f);
    }
});

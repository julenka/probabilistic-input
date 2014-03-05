/**
 * Include this file to hook into all mouse and key events and register listeners.
 * Still sends all events through to the DOM.
 * NOTE: there should only ever be one eventHook object per page
 * Created by julenka on 3/5/14.
 */

"use strict"

// *** This code requires utils.js ***

// TODO: may want to have a global 'pUI' object and access eventHook through that
function EventHook(el) {
    if(typeof el === 'undefined') {
        el = window;
    }
    this.listeners = [];

    var me = this;
    ['mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'click', 'keypress'].forEach(function (type) {
        el.addEventListener(type, bind(me, "handleEvent"), true);
    });
}

EventHook.prototype.addEventListener = function (f) {
    this.listeners.push(f);
};

EventHook.prototype.handleEvent = function (e) {
    // dispatch each event to every listener, don't discriminate
    this.listeners.forEach(function (fn) {
        fn(e);
    });
    // To stop propagation, do the following:
    // TODO: Check if duplicate move events get sent because of this. If so, will need to stop propagation
//    e.preventDefault();
//    e.stopPropagation();
};


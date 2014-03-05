/**
 * Include this file to hook into all mouse and key events and register listeners.
 * Still sends all events through to the DOM.
 *
 * Created by julenka on 3/5/14.
 */
"use strict"
// Wraps a call to a method within the context of another.
function bind(context,name){
    return function(){
        return context[name].apply(context,arguments);
    };
}

// event hook code here

// global 'eventHook' hooks into events, use this to add listeners
// TODO: may want to have a global 'pUI' object and access eventHook through that

function EventHook() {
    this.listeners = [];
}

EventHook.prototype.addEventListener = function(f) {
    this.listeners.push(f);
};

EventHook.prototype.handleEvent = function(e) {
    // dispatch each event to every listener, don't discriminate
    this.listeners.forEach(function(fn) {
        fn(e);
    });
    // To stop propagation, do the following:
//    e.preventDefault();
//    e.stopPropagation();
};

// there should only ever be one eventHook object per page
// TODO: can we enforce this?
var eventHook = new EventHook();
['mousedown', 'mousemove', 'mouseup', 'keydown', 'keyup', 'click', 'keypress'].forEach(function(type) {
    window.addEventListener(type, bind(eventHook, "handleEvent"), true);
});

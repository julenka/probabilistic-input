/**
 * Created by julenka on 8/13/14.
 */

/**
 * Drag Event base class
 * @type {*}
 */
var DragEvent = PEvent.subClass({
    className: "DragEvent",
    /**
     *
     * @param view The view that send this drag event. Used by consumers to determine how to respond.
     */
    init: function(view) {
        this._super(1, undefined, view);
        this.view = view;
        this.source = "virtual";

    },
    /**
     * Super naive getSamples implementation that just returns itself. If in future we
     * need to send more samples, should do this
     * @param n
     * @returns {DragStartEvent}
     */
    getSamples: function(n) {
        return [this];
    }
});

/**
 * Represents the start of a drag
 * @type {*}
 */
var DragStartEvent = DragEvent.subClass({
    className: "DragStartEvent",
    /**
     * Initialize Drag Start Event
     * @param identify_p 1
     * @param e undefined
     * @param view view that began dragging
     */
    init: function(view) {
        this._super(view);
        this.type = "dragstart";
    }

});

/**
 * Represents the end of a drag
 * @type {*}
 */
var DragEndEvent = DragEvent.subClass({
    className: "DragEndEvent",
    init: function(view) {
        this._super(view);
        this.type = "dragend";
    }
});
var DragProgressEvent = DragEvent.subClass({
    className: "DragProgressEvent",
    init: function(view) {
        this._super(view);
        this.type = "dragprogress";
    }
});

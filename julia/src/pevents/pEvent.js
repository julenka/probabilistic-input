/**
 * Created by julenka on 7/18/14.
 */


var PEvent = Object.subClass({
    className: "PEvent",
    init: function (identity_p, e) {
        // base event is the event that this probabilsitic event was generated from.
        // seems useful, not sure. Maybe it can be either a regular DOM event or
        this.base_event = e;
        this.identity_p = identity_p;
    },
    getSamples: function () {
        throw "not implemented!";
    }
});

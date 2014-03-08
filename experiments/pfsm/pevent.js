/**
 * Created by julenka on 3/8/14.
 */

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
// TODO: comment the code better

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

var PKeyEvent = PEvent.subClass({
    init: function(identity_p, e) {
        this._super(identity_p, e);
        this.keyCode = e.keyCode;
        this.source="keyboard";
        this.type = e.type;
    },
    getSamples: function(n) {
        var i;
        var result = [];
        for(i = 0; i < n; i++) {
            result.push(new PKeyEvent(1/n, this.base_event));
        }
        return result;
    }
});
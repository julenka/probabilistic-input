/**
 * Created by julenka on 7/18/14.
 */


var PMouseEvent = PEvent.subClass({
    className: "PMouseEvent",
    init: function (identity_p, e, sigma_x, sigma_y, type, currentTarget) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.sigma_x = sigma_x;
        this.sigma_y = sigma_y;
        this.type = type;
        if(e.type === "mousedown") {
            PMouseEvent.prototype.button_state = "down";
        } else if (e.type === "mouseup") {
            PMouseEvent.prototype.button_state = undefined;
        }
        this.source = "mouse";

        var left = 0, top = 0;
        //noinspection JSUnresolvedVariable
        if (currentTarget !== window) {
            //noinspection JSHint
            var offset = $(currentTarget).offset();
            left = offset.left;
            top = offset.top;
        }
        if(isNaN(left)) {
            left = 0 ;
        }
        if(isNaN(top)) {
            top = 0;
        }
        this.element_x = e.pageX - left;
        this.element_y = e.pageY - top;
    },
    getSamples: function (n) {
        var result = [];
        var randomValues = this.getRandomValues(n);
        for (var i = 0; i < n; i++) {
            var xy = randomValues[i];
            //noinspection JSUnresolvedVariable
            result.push(new PMouseEventSample(1 / n, this,
                this.base_event.pageX + xy.x,
                this.base_event.pageY + xy.y,
                this.element_x + xy.x,
                this.element_y + xy.y));
        }
        return result;
    },
    hashSigmaXSigmaY: function() {
        return this.sigma_x + ',' + this.sigma_y;
    },
    getRandomValues: function(n) {
        var hash = this.hashSigmaXSigmaY();
        if(! (hash in this.pseudorandom_samples)) {
            this.pseudorandom_samples[hash] = [];
        }
        if((typeof this.button_state) === "undefined") {
            this.pseudorandom_samples[hash] = [];
            for(var i = 0; i < n; i++) {
                this.pseudorandom_samples[hash].push({x: Math.sampleFromGaussian(this.sigma_x), y: Math.sampleFromGaussian(this.sigma_y)});
            }
        } else {
            while(this.pseudorandom_samples[hash].length < n){
                this.pseudorandom_samples[hash].push({x: Math.sampleFromGaussian(this.sigma_x), y: Math.sampleFromGaussian(this.sigma_y)});
            }
        }

        return this.pseudorandom_samples[hash];
    }
});

PMouseEvent.prototype.pseudorandom_samples = {};
var PMouseEventSample = PEvent.subClass({
    className: "PMouseEventSample",
    init: function (identity_p, e, client_x, client_y, element_x, element_y) {
        //noinspection JSUnresolvedFunction
        this._super(identity_p, e);
        this.element_x = element_x;
        this.element_y = element_y;
        this.source = "mouse";
        this.type = e.type;
    },
    draw: function($el) {
        var s = Snap($el);
        s.circle(this.element_x, this.element_y, 2).attr({fill: 'pink', opacity: 0.5});
    }
});



/**
 * Created by julenka on 7/18/14.
 */


/**
 * Voice event as defined by chrome voice api
 * @type {*}
 */
var PVoiceEvent = PEvent.subClass({
    className: "PVoiceEvent",
    init: function (e) {
        this._super(1, e);
        this.source = "voice";
    },
    getSamples: function () {
        var result = [];
        for(var i = this.base_event.resultIndex; i < this.base_event.results.length; i++) {
            for (var j = 0; j < this.base_event.results[i].length; j++) {
                var alternative = this.base_event.results[i][j];
                result.push(new PVoiceEventSample(alternative.confidence, this, alternative.transcript.trim(), this.base_event.results[i].isFinal));
                log(LOG_LEVEL_DEBUG, alternative.transcript);
            }
        }
        return result;
    }
});

var PVoiceEventSample = PEvent.subClass({
    className: "PVoiceEventSample",
    init: function(identity_p, e, transcript, is_final) {
        this._super(identity_p, e);
        this.transcript = transcript;
        this.source = "voice";
        this.type = is_final ? "final" : "interim";
    }
});

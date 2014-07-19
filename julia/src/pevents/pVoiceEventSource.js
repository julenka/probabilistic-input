/**
 * Created by julenka on 7/18/14.
 */


var PVoiceEventSource = PEventSource.subClass({
    className: "PVoiceEventSource",
    init: function() {
        if (!('webkitSpeechRecognition' in window)) {
            var message = "Web Speech API is not supported by this browser. Upgrade to Chrome version 25 or later";
            log(LOG_LEVEL_ERROR, message);
            window.alert(message);
        } else {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 20;
            var me = this;
            this.recognition.onstart = function() {
                log(LOG_LEVEL_DEBUG, "speech started");
                if(typeof(me.onstart) !== 'undefined') {
                    me.onstart();
                }
            };

            this.recognition.onerror = function(event) {
                log(LOG_LEVEL_DEBUG, "ERROR on speech recognition", event.error);
                if(typeof(me.onerror !== 'undefined')) {
                    me.onerror(event.error);
                }
            };

            this.recognition.onend = function() {
                log(LOG_LEVEL_DEBUG, "speech ended");
                if(typeof(me.onend) !== 'undefined') {
                    me.onend();
                }
            };
            this.event_listeners = [];
            this.recognition.onresult = function(event) {
                me.event_listeners.forEach(function(listener) {
                    listener(new PVoiceEvent(event));
                });
            };
        }
    },
    addListener: function(fn) {
        this.event_listeners.push(fn);
    },
    stop: function() {
        if(typeof(this.recognition) === 'undefined') {
            return;
        }
        this.recognition.stop();
    },
    start: function() {
        if(typeof(this.recognition) === 'undefined') {
            return;
        }
        this.recognition.start();
    }
});

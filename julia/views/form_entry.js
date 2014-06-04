/**
 * Created by julenka on 6/4/14.
 */

var FormEntry = FSMView.subClass({
    // TODO: Migrate this to using properties when you feel like doing mindless refactoring
    className: "FormLabel",
    init: function(julia, label, inputValidFunction, entryTextValidFunction, x, y, onCompleteFn) {
        this._super(julia);
        this.entry_text = "";
        this.entry_opacity = 0.6;
        this.x = x;
        this.y = y;
        this.width = 400;
        this.height = 30;
        this.label = label;
        this.message = "";
        this.onCompleteFn = onCompleteFn;
        this.validFunction = inputValidFunction;
        this.entryTextValidFunction = entryTextValidFunction;
        this.interim_text = "";
        this.fsm_description = {
            start: [
                new KeypressTransition(
                    "textEntered",
                    function(e) {
                        return !(e.keyCode == 9 || e.keyCode == 13 || String.fromCharCode(e.keyCode).toLowerCase() === "x") &&
                            this.validFunction(String.fromCharCode(e.keyCode));
                    },
                    function(e) {
                        this.entry_opacity = 0.6;
                        this.entry_text += String.fromCharCode(e.keyCode);
                        this.container.setFocus(this);
                        this.message = "keep going...";
                    }, // feedback
                    undefined,
                    true
                ),
                new VoiceTransition(
                    "voiceEntered",
                    "interim",
                    function(e) { return this.validFunction(e.transcript); },
                    function(e) {
                        this.entry_opacity = 0.6;
                        this.entry_text = e.transcript;
                        this.container.setFocus(this);
                        this.message = "keep going...";
                    },
                    undefined,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                ),
                new VoiceTransition(
                    "start",
                    "interim",
                    function(e) { return true },
                    function(e) {},
                    undefined,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                )
            ],
            voiceEntered: [
                new VoiceTransition(
                    "voiceEntered",
                    "interim",
                    function(e) { return this.validFunction(e.transcript); },
                    function(e) {
                        this.entry_opacity = 0.6;

                        this.message = "keep going...";
                    },
                    undefined,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                ),
                new VoiceTransition(
                    "done",
                    "final",
                    function(e) { return this.entryTextValidFunction(e.transcript); },
                    undefined,
                    this.entry_completed,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                ),
                new MouseDownTransition(
                    "done",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && this.entryTextValidFunction(this.entry_text);
                    },
                    undefined,
                    this.entry_completed,
                    true
                ),
                new MouseDownTransition(
                    "voiceEntered",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && !this.entryTextValidFunction(this.entry_text);
                    },
                    function() {
                        this.message = "not valid!"
                    },
                    undefined,
                    false
                ),
            ],
            textEntered : [
                // voice and interim (assume entry is valid?)

            /** Pressing the enter key and entry is valid **/
                new MouseDownTransition(
                    "done",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && this.entryTextValidFunction(this.entry_text);
                    },
                    undefined,
                    this.entry_completed,
                    true
                ),
                new MouseDownTransition(
                    "textEntered",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && !this.entryTextValidFunction(this.entry_text);
                    },
                    function() {
                        this.message = "not valid!"
                    },
                    undefined,
                    false
                ),
                new KeypressTransition(
                    "done",
                    function(e, rootView) { return e.keyCode == 13 && this.entryTextValidFunction(this.entry_text); }, // 9 is tab, 13 is enter
                    undefined,
                    this.entry_completed, // final
                    true
                ),
            /** Pressing the enter key but entry is invalid **/
                new KeypressTransition(
                    "textEntered",
                    function(e) { return e.keyCode == 13 && !this.entryTextValidFunction(this.entry_text); }, // 9 is tab, 13 is enter
                    function() {
                        this.message = "not valid!"
                    },
                    undefined, // final
                    true
                ),
            /** Pressing 'x' deletes text...if no text then we shoudl clear our focus **/
                new KeypressTransition(
                    "start",
                    function(e) {
                        return String.fromCharCode(e.keyCode).toLowerCase() === "x" && this.entry_text.length <= 1;
                    },
                    function(e) {
                        this.entry_text = "";
                        this.container.clearFocus();
                        this.message = "";
                    },
                    undefined,
                    true
                ),
            /** Pressing some other key. Check if the text is valid if not, we should kill the alternative. If it is valid, then keep doing **/
                new KeypressTransition(
                    "textEntered",
                    function(e) {
                        return !(e.keyCode == 9 || e.keyCode == 13) &&
                            !(String.fromCharCode(e.keyCode).toLowerCase() === "x" && this.entry_text.length <= 1);
                    },
                    function(e, rootView) {
                        if(!(this.validFunction(String.fromCharCode(e.keyCode)))) {
                            rootView.kill = true;
                            return;
                        }
                        if(String.fromCharCode(e.keyCode).toLowerCase() === "x") {
                            this.entry_text = this.entry_text.substring(0, this.entry_text.length - 2);
                        } else {
                            this.entry_text += String.fromCharCode(e.keyCode);
                            this.message = "keep going...";
                        }


                    }, // feedback
                    undefined,
                    true
                )
            ],
            done: [

            ]
        }
    },
    predicate_mouse_in_region: function(e) {
        var rx = e.element_x - this.x;
        var ry = e.element_y - this.y + this.height;
        var result = rx > 0 && ry > 0 && rx < this.width && ry < this.height;
        log(LOG_LEVEL_DEBUG, e.element_x, e.element_y, this.label, "rx:", rx, "ry:", ry, result);
        return result;
    },
    entry_completed: function(e) {
        this.message = "complete";
        this.entry_opacity = 1.0;
        this.container.clearFocus();
        if(typeof this.onCompleteFn !== 'undefined') {
            this.onCompleteFn(this, rootView);
        }
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.text(this.x,this.y, this.label + ": ");
        s.text(this.x + 140, this.y, this.entry_text).attr({opacity: this.entry_opacity, "font-family": "monospace"});
        s.text(this.x + 300, this.y, this.message);
        var color = "rgb(0,0,0)";
        if(this.current_state == "textEntered") {
            var char_width = 8;

            s.line(this.x + 140 + this.entry_text.length * char_width, this.y, this.x + 140 + this.entry_text.length * char_width + 7, this.y)
                .attr({stroke: "rgb(0,0,0)"});
        }
        s.rect(this.x + 130, this.y - this.height + 10, this.width - 250, this.height).attr({"fill-opacity": 0, "stroke-width": 1, stroke: color});
    },
    clone: function() {
        var result = new FormEntry(this.julia, this.label, this.validFunction, this.entryTextValidFunction, this.x, this.y);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        result.entry_text = this.entry_text;
        result.entry_opacity = this.entry_opacity;
        result.message = this.message;
        result.onCompleteFn = this.onCompleteFn;
        result.interim_text = this.interim_text;
        return result;
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.label === other.label && this.entry_text === other.entry_text && this.interim_text === other.interim_text;
    }
});

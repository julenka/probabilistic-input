/**
 * Created by julenka on 6/4/14.
 */
var FormLabel = View.subClass({
    className: "FormLabel",
    init: function(julia, props) {
        this.super(julia, props, {text: "empty", x: 0, y: 0});
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.text(this.properties.x, this.properties.y, this.properties.label);
    }
});

var FormEntry = FSMView.subClass({
    // TODO: Migrate this to using properties when you feel like doing mindless refactoring
    className: "FormEntry",
    isDeleteKey: function(keyCode) {
        return String.fromCharCode(keyCode).toLowerCase() === "x";
    },
    isTabOrEnter: function(keyCode) {
        return keyCode === 9 || keyCode === 13;
    },
    updateMessage: function(message, rootView) {
//        rootView.findViewById(this.properties.label_id).text = "keep going...";
        this.properties.message = message;
    },

    /**
     *
     * @param julia
     * @param label
     * @param inputValidFunction
     * @param entryTextValidFunction
     * @param x
     * @param y
     * @param onCompleteFn
     * message_id will be id of the message view
     * label_id will be id of the label view
     */
    init: function(julia, props, inputValidFunction, entryTextValidFunction, entryCompleted) {
        var defaults = {
            entry_text: "",
            entry_opacity: 0.6,
            x: 0,
            y: 0,
            width: 400,
            height: 30,
            interim_text: "",
            label: "no label",
            message: "",
            entryCompleted: entryCompleted
        };
        this._super(julia, props, defaults);
        this.fsm_description = {
            start: [
                new KeypressTransition(
                    "textEntered",
                    function(e) {
                        return !(this.isTabOrEnter(e.keyCode) ||  this.isDeleteKey(e.keyCode)) &&
                            inputValidFunction(String.fromCharCode(e.keyCode));
                    },
                    function(e, rootView) {
                        this.properties.entry_opacity = 0.6;
                        this.properties.entry_text += String.fromCharCode(e.keyCode);
                        this.container.setFocus(this);
                        this.updateMessage("keep going...", rootView);
                    }, // feedback
                    undefined,
                    true
                ),
                new VoiceTransition(
                    "voiceEntered",
                    "interim",
                    function(e) { return inputValidFunction(e.transcript); },
                    function(e) {
                        this.properties.entry_opacity = 0.6;
                        this.properties.entry_text = e.transcript;
                        this.container.setFocus(this);
                        this.properties.message = "keep going...";
                    },
                    undefined,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                ),
                new VoiceTransition(
                    "start",
                    "interim",
                    function() { return true },
                    function() {},
                    undefined,
                    true
                )
            ],
            voiceEntered: [
                new VoiceTransition(
                    "voiceEntered",
                    "interim",
                    function(e) { return inputValidFunction(e.transcript); },
                    function(e, rootView) {
                        this.properties.entry_opacity = 0.6;
                        this.updateMessage("keep going...", rootView);
                    },
                    undefined,
                    true
                ),
                new VoiceTransition(
                    "done",
                    "final",
                    function(e) { return entryTextValidFunction(e.transcript); },
                    undefined,
                    this.entry_completed,
                    true
                    // to,source,type,predicate,feedback_action,final_action,handles_event)
                ),
                new MouseDownTransition(
                    "done",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && entryTextValidFunction(this.properties.entry_text);
                    },
                    undefined,
                    this.entry_completed,
                    true
                ),
                new MouseDownTransition(
                    "voiceEntered",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && !entryTextValidFunction(this.properties.entry_text);
                    },
                    function() {
                        this.properties.message = "not valid!"
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
                        return this.predicate_mouse_in_region(e) && entryTextValidFunction(this.properties.entry_text);
                    },
                    undefined,
                    this.entry_completed,
                    true
                ),
                new MouseDownTransition(
                    "textEntered",
                    function(e) {
                        return this.predicate_mouse_in_region(e) && !entryTextValidFunction(this.properties.entry_text);
                    },
                    function(rootView) {
                        this.updateMessage("not valid!", rootView);
                    },
                    undefined,
                    false
                ),
                new KeypressTransition(
                    "done",
                    function(e, rootView) {
                        return e.keyCode === 13 &&
                            entryTextValidFunction(this.properties.entry_text); }, // 9 is tab, 13 is enter
                    undefined,
                    this.entry_completed, // final
                    true
                ),
            /** Pressing the enter key but entry is invalid **/
                new KeypressTransition(
                    "textEntered",
                    function(e) { return e.keyCode === 13 &&
                        !entryTextValidFunction(this.properties.entry_text); }, // 9 is tab, 13 is enter
                    function(e, rootView) {
                        this.updateMessage("not valid!", rootView);
                    },
                    undefined, // final
                    true
                ),
            /** Pressing 'x' deletes text...if no text then we shoudl clear our focus **/
                new KeypressTransition(
                    "start",
                    function(e) {
                        return this.isDeleteKey(e.keyCode) && this.properties.entry_text.length <= 1;
                    },
                    function(e, rootView) {
                        this.properties.entry_text = "";
                        this.container.clearFocus();
                        this.updateMessage("", rootView);
                    },
                    undefined,
                    true
                ),
            /** Pressing some other key. Check if the text is valid if not, we should kill the alternative. If it is valid, then keep doing **/
                new KeypressTransition(
                    "textEntered",
                    function(e) {
                        return !this.isTabOrEnter(e.keyCode) &&
                            !(this.isDeleteKey(e.keyCode) && this.properties.entry_text.length <= 1);
                    },
                    function(e, rootView) {
                        if(!(inputValidFunction(String.fromCharCode(e.keyCode)))) {
                            rootView.kill = true;
                            return;
                        }
                        if(this.isDeleteKey(e.keyCode)) {
                            this.properties.entry_text = this.properties.entry_text.substring(0, this.properties.entry_text.length - 2);
                        } else {
                            this.properties.entry_text += String.fromCharCode(e.keyCode);
                            this.updateMessage("keep going...", rootView);
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
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y + this.properties.height;
        var result = rx > 0 && ry > 0 && rx < this.properties.width && ry < this.properties.height;
        log(LOG_LEVEL_DEBUG, e.element_x, e.element_y, this.properties.label, "rx:", rx, "ry:", ry, result);
        return result;
    },
    entry_completed: function(e, rootView) {
        this.properties.message = "complete";
        this.properties.entry_opacity = 1.0;
        this.container.clearFocus();
        if(typeof this.properties.entryCompleted !== 'undefined') {
            this.properties.entryCompleted(this, rootView);
        }
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.text(this.properties.x,this.properties.y, this.properties.label + ": ");
        s.text(this.properties.x + 140, this.properties.y, this.properties.entry_text).attr({opacity: this.properties.entry_opacity, "font-family": "monospace"});
        s.text(this.properties.x + 300, this.properties.y, this.properties.message);
        var color = "rgb(0,0,0)";
        if(this.current_state == "textEntered") {
            var char_width = 8;

            s.line(this.properties.x + 140 + this.properties.entry_text.length * char_width, this.properties.y, this.properties.x + 140 + this.properties.entry_text.length * char_width + 7, this.properties.y)
                .attr({stroke: "rgb(0,0,0)"});
        }
        s.rect(this.properties.x + 130, this.properties.y - this.properties.height + 10, this.properties.width - 250, this.properties.height).attr({"fill-opacity": 0, "stroke-width": 1, stroke: color});
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        return this.properties.label === other.label && this.properties.entry_text === other.entry_text && this.interim_text === other.interim_text;
    }
});

/**
 * Created by julenka on 6/18/14.
 */

var HighlightTextView  = FSMView.subClass({
    className: "FSMTextView",
    char_width: 8,
    char_height: 20,
    /**
     * properties:
     * x,y,w,text
     * @param julia
     * @param properties
     */
    init: function(julia, properties) {
        this._super(julia,properties);
        this.properties.chars_per_line = Math.floor(this.properties.w / this.char_width);
        this.properties.num_lines = this.properties.text.length / this.properties.chars_per_line;
        this.properties.h = this.char_height * this.properties.num_lines;
        this.lines = [];
        for(var i = 0; i < this.properties.num_lines - 1; i++) {
            this.lines.push(this.properties.text.substring(i * this.properties.chars_per_line, (i+1) * this.properties.chars_per_line));
        }
        this.fsm_description = {
            start: [
                new MouseDownTransition(
                    "down",
                    this.hit_test,
                    this.select_start,
                    undefined,
                    true
                )
            ],
            down: [
                new MouseMoveTransition(
                    "down",
                    function() { return true;},
                    this.select_update,
                    undefined,
                    true
                ),
                new MouseUpTransition(
                    "start",
                    function() { return true; },
                    undefined,
                    this.select_end,
                    true
                )
            ]
        };
    },
    select_end: function(e, rootView) {
    },
    select_start: function(e, rootView) {
        var idx = this.get_index(e);

        this.properties.start_index = idx;
        this.properties.end_index = idx + 1;
    },
    select_update: function(e, rootView) {
        var cur_idx = this.get_index(e);
        if(cur_idx > this.properties.text.length || cur_idx < 0) { return; }
        this.properties.end_index = cur_idx;
    },
    clone: function() {
        var result = this._super();
        result.lines = deepCopy(this.lines);
        return result;
    },
    get_relative: function(e) {
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y;
        return {rx: rx, ry: ry};
    },
    hit_test: function(e) {
        var coords = this.get_relative(e);
        var rx = coords.rx;
        var ry = coords.ry;
        ry = ry + this.char_height;
        if(rx > this.properties.w || ry > this.properties.h || rx < 0 || ry < 0) {
            return false;
        }
        return true;
    },
    get_index: function(e) {
        // assumes that we're already hit tested
        var coords = this.get_relative(e);
        var rx = coords.rx;
        var ry = coords.ry;
        ry = ry + this.char_height;

        var char_x = Math.floor(rx / this.char_width);
        var char_y = Math.floor(ry / this.char_height);
        return char_y * this.properties.chars_per_line + char_x;
    },
    draw: function($el) {
        var s = Snap($el[0]);
        if(typeof(this.properties.start_index) !== 'undefined') {
            var highlight_attrs = {fill: 'yellow'};
            var start_index = this.properties.start_index;
            var end_index = this.properties.end_index;
            if(start_index > end_index) {
                var tmp = start_index;
                start_index = end_index;
                end_index = tmp;
            }
            var start_y = Math.floor(start_index / this.properties.chars_per_line);
            var end_y = Math.floor(end_index / this.properties.chars_per_line);
            var start_x = start_index % this.properties.chars_per_line;
            var end_x = end_index % this.properties.chars_per_line;
            var rect_width;
            var char_height = this.char_height;
            var char_width = this.char_width;
            if(start_y === end_y) {
                rect_width = (end_x - start_x) * char_width;
                s.rect(this.properties.x + start_x * char_width, this.properties.y + start_y * char_height - char_height, rect_width, char_height).attr(highlight_attrs);
            } else {
                // first line
                rect_width = this.properties.w - start_x * char_width;
                s.rect(this.properties.x + start_x * char_width, this.properties.y + start_y * char_height - char_height, rect_width, char_height).attr(highlight_attrs);
                // middle
                if(end_y - start_y > 1) {
                    var rect_height = (end_y - start_y - 1) * char_height;
                    s.rect(this.properties.x, this.properties.y + (start_y + 1) * char_height - char_height, this.properties.w, rect_height).attr(highlight_attrs);
                }
                // last line
                rect_width = end_x * char_width;
                s.rect(this.properties.x, this.properties.y + end_y * char_height - char_height, rect_width, char_height).attr(highlight_attrs);
            }
        }
        var text = s.text(this.properties.x,this.properties.y,this.lines).attr({'font-family': 'monospace'});
        text.selectAll("tspan:nth-child(n+2)").attr({
            dy: "" + this.char_height + "px",
            x: this.properties.x
        });
    }
});
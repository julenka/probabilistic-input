/**
 * Created by julenka on 3/8/14.
 */

// TODO: add module system!

var Sketch = Object.subClass({
    init: function(props) {
        if (typeof props == 'undefined') {
            return;
        }
        for(var name in props) {
            this[name] = props[name];
        }
    },
    dispatchEvent: function(e) {
        // by default, just copy yourself over
        return {
            new_sketches: [this]
        };
    },

    // According to http://stackoverflow.com/a/5344074/809040, it is much faster to
    // manually copy all of your elements when cloning. So, right now we do this, because
    // we will be cloning a lot.
    clone: function() {
        return new Sketch();
    },
    draw: function($el) {
        $el.append("default sketch");
    }
});

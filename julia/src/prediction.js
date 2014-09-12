/**
 * Created by julenka on 7/29/14.
 */
var PredictionAfterMouseEventHook = DOMEventSource.subClass({
    className: "PredictionAfterMouseEventHook",
    init: function(el, predictor, julia) {
        this._super(el);
        this.predictor = predictor;
        this.julia = julia;
    },
    addListener: function(fn) {
        var me = this;

        ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(type) {
            var fn2 = function(e) {
                // Predict only from the last certain view, i.e. the root view
                var predictionEvent = me.predictor.predict(me.julia.rootView);
                fn(predictionEvent);
            };
            me.event_listeners.push({type: type, fn: fn2});
            me.el.addEventListener(type, fn2);
        });
    }
});

var MouseEventPredictor = Object.subClass({
    className: "MouseEventPredictor",
    init: function(julia, $el) {
        this.dx = 0;
        this.dy = 0;
        this.julia = julia;
        var me = this;
        $(window).on("mousemove", function(e){
            var offset = $el.offset();
            var x = e.pageX - offset.left;
            var y = e.pageY - offset.top;
            if(!me.dx) {
                me.dx = 0;
                me.dy = 0;
            }
            if(me.lastX) {
                var smooth = 0.9;
                me.dx = me.dx * smooth + (x - me.lastX) * (1 - smooth);
                me.dy = me.dy * smooth + (y - me.lastY) * (1 - smooth);
            }
            me.lastX = x;
            me.lastY = y;
        });
    },
    predict: function() {
        var lookAhead = 30;
        var newX = this.lastX + this.dx * lookAhead ;
        var newY = this.lastY + this.dy * lookAhead ;

        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("mousemove", true, true, this.el, 0, newX, newY, newX, newY,
            false, false, false, false, 0, null);

        return new PMouseEvent(1, event, 30, 30, "mousemove", window);
    }
});

var MenuEventPredictor = Object.subClass({
    className: "MenuEventPredictor",
    init: function( menu_id) {
        this.menu_id = menu_id;
    },
    /**
     * Predicts the menu item a user wishes to select.
     * @param rootView
     * @returns MenuPredictionEvent, an event containing predictions for next step
     */
    predict: function(rootView) {
        var menu = rootView.findViewById(this.menu_id);
        return this.predictFromMenu(menu);

    },
    predictFromMenu: function(menu) {
        var result = new MenuPredictionEvent();
        if(!menu.active_child) {
            return result;
        }
        var descendants = menu.active_child.getDescendants();
        // If this item has no descendants, then predict siblings, not descendants
//        if(descendants.length == 0 && menu.active_child.getParent()) {
//            descendants = menu.active_child.getParent().getDescendants();
//        }
        var sum = descendants.reduce(function(prev, cur) {
            if(!cur.frequency) {
                return prev;
            }
            return prev + cur.frequency;
        }, 0);
        if(sum === 0 ){
            return result;
        }

        descendants.forEach(function(d) {
            if(d.frequency){
                result.addEventSample(new MenuPredictionEventSample(d, d.frequency / sum));
            }
        });
        return result;
    }
});

var MenuPredictionEvent = PEvent.subClass({
    className: "MenuPredictionEvent",
    init: function() {
        this.samples = [];
    },
    addEventSample: function(sample) {
        this.samples.push(sample);
    },
    getSamples: function(){
        return this.samples;
    }
});

var MenuPredictionEventSample = PEvent.subClass({
    className: "MenuPredictionEventSample",
    init: function(item, probability) {
        this._super(probability, undefined);
        this.source = "virtual";
        this.type = "menu";
        this.item  = item;
    }
});
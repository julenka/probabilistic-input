/**
 * Created by julenka on 7/18/14.
 */
/** Feedback objects associated with animating things **/

var AnimateFeedback = Object.subClass({
    className: "AnimateFeedback",
    init: function(julia, props) {
        this.julia = julia;
        this.viewsToUpdate = [];
        this.feedbackType = AnimateJitterRotate;
        setInterval(bind(this,"updateViews"), 60);
        for(var option in props) {
            this[option] = props[option];
        }
    },
    updateViews: function() {
        for(var i = 0; i < this.viewsToUpdate.length; i++) {
            this.viewsToUpdate[i].update();
        }
    },
    draw: function($el) {
        this.viewsToUpdate = [];
        // creates a merged UI combining the interface alternatives
        // root: the certain root that we have
        // alternatives: all the alternatives for this item
        var me = this;
        var mergeHelper = function(root, alternatives) {
            if(!(root instanceof ContainerView)) {
                // base case
                var dirty_vps = [];
                for(var i = 0; i < alternatives.length; i++) {
                    var viewAndProbability = alternatives[i];
                    // Don't render feedback for extremely unlikely things
                    if(viewAndProbability.view._dirty) {
                        dirty_vps.push(viewAndProbability);
                    }
                }
                var v = new me.feedbackType(me.julia, dirty_vps, root);
                me.viewsToUpdate.push(v);
                return v;
            }

            // this is a containerview
            // For now, assume container is NOT dirty
            for(var i = 0; i < root.children.length; i++) {
                var child = root.children[i];
                var new_alternatives = [];
                for(var j = 0; j < alternatives.length; j++) {
                    new_alternatives.push({view: alternatives[j].view.children[i],
                        probability: alternatives[j].probability});
                }
                root.children[i] = mergeHelper(child, new_alternatives);
            }
            return root;

        };
        // merge the interface
        var mergedRoot = mergeHelper(this.julia.rootView.clone(), this.julia.alternatives);
        mergedRoot.draw($el);
        return mergedRoot;
    }
});

var AnimateBase = View.subClass({
    className: "AnimateBase",
    init: function(julia, dirty_vps, root) {
        this._super(julia, {});
        this.dirtyVps = dirty_vps;
        this.root = root;
    },
    draw: function($el) {
        if(this.dirtyVps.length == 0) {
            this.root.draw($el);
        } else {
            var sortedAlternatives = this.dirtyVps.sort(function(a,b) {
                return b.probability - a.probability;
            });
            var snap = Snap($el[0]);
            this.group = snap.group();
            this.view = sortedAlternatives[0].view;
            this.view.draw($(this.group.node));

            this.nAlternatives = sortedAlternatives.length;
            this.sortedAlternatives = sortedAlternatives;
            this.setup($el);
        }
    },
    setup: function() {
        throw "AnimateBase.setup() not implemented!";
    }
});

var AnimateFade = AnimateBase.subClass({
    className: "AnimateFade",
    setup: function($el){
        this.nCrossFadeFrames = 20;
        this.crossFadeIndex = 0;
        this.currentFrame = 0;
        this.nextFrame = this.sortedAlternatives.length > 1 ? 1 : 0;
        this.nextFrameGroup = Snap($el[0]).group();
    },
    update: function() {
        // we can use boolean to check for defined here because gropu shoudl never be false or 0
        if(!this.group) {
            return;
        }
        this.view = this.sortedAlternatives[this.currentFrame].view;
        var $group = $(this.group.node);
        $group.empty();
        this.view.draw($group);
        if(this.currentFrame === this.nextFrame) {
            return;
        }
        var nextFrameOpacity = this.crossFadeIndex / this.nCrossFadeFrames;
        this.nextView = this.sortedAlternatives[this.nextFrame].view;
        var $nextGroup = $(this.nextFrameGroup.node);
        $nextGroup.empty();
        this.nextView.draw($nextGroup);
        this.group.attr({opacity: 1 - nextFrameOpacity});
        this.nextFrameGroup.attr({opacity: nextFrameOpacity});
        this.crossFadeIndex++;
        if(this.crossFadeIndex > this.nCrossFadeFrames) {
            this.crossFadeIndex = 0;
            this.currentFrame = this.nextFrame;
            this.nextFrame++;
            this.nextFrame %= this.sortedAlternatives.length;
        }
    }
});
var AnimateJitterRotate = AnimateBase.subClass({
    className: "AnimateJitterRotate",
    setup: function() {
        var amp = 0.5;
        this.minValue = -amp;
        this.maxValue = amp;
        this.increment = this.nAlternatives;
        this.value = 0;
    },
    update: function() {
        if(typeof(this.group) === 'undefined') {
            return;
        }
        var m = new Snap.Matrix();
        var bbox = this.group.getBBox();
        m.rotate(this.value, bbox.cx, bbox.cy);
        this.group.attr({transform: m.toString()});
        this.value += this.increment;
        if(this.value < this.minValue || this.value > this.maxValue) {
            this.increment *= -1;
            // clamp
            this.value = Math.remap(this.value, this.minValue, this.maxValue, this.minValue, this.maxValue);
        }
    }
});

var AnimateJitterTranslate = AnimateBase.subClass({
    className: "AnimateJitterTranslate",
    setup: function() {
        var amp = Math.pow(this.nAlternatives, 2) * 0.5;
        this.minValue = -amp;
        this.maxValue = amp;
        this.increment = amp * 5;
        this.value = 0;
    },
    update: function() {
        if(typeof(this.group) === 'undefined') {
            return;
        }
        var m = new Snap.Matrix();
        m.translate(this.value, 0);
        this.group.attr({transform: m.toString()});
        this.value += this.increment;
        if(this.value < this.minValue || this.value > this.maxValue) {
            this.increment *= -1;
            // clamp
            this.value = Math.remap(this.value, this.minValue, this.maxValue, this.minValue, this.maxValue);
        }
    }
});

var AnimateJitterScale = AnimateBase.subClass({
    className: "AnimateJitterTranslate",
    setup: function() {
        var amp = this.nAlternatives / 20;
        this.minValue = 1;
        this.maxValue = 1 + amp;
        this.increment = amp / 10;
        this.value = 1;
    },
    update: function() {
        if(typeof(this.group) === 'undefined') {
            return;
        }
        var m = new Snap.Matrix();
        var x = this.view.x;
        var y = this.view.y;
        var bbox = this.group.getBBox();
        m.scale(this.value, this.value, bbox.cx, bbox.cy);
        this.group.attr({transform: m.toString()});
        this.value += this.increment;
        if(this.value < this.minValue || this.value > this.maxValue) {
            this.increment *= -1;
            // clamp
            this.value = Math.remap(this.value, this.minValue, this.maxValue, this.minValue, this.maxValue);
        }
    }
});

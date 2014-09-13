/**
 * Created by julenka on 7/18/14.
 */

/** Overlay alternate versions using different filterd **/


var OverlayFeedback = Object.subClass({
    className: "OverlayFeedback",
    /**
     *
     * for each view in an interface:
     *   if it is not a container and there are multiple different versions of this view:
     *     create a new view that overlays all alernative versions of this view, with different transformations.
     *
     * This feedback will only show multiple alternatives of the exact same view (e.g. same id).
     * Optionally shows the original view as well as alternatives.
     *
     * Properties:
     * feedbackType: the style of overlay feedback to use. Defaults to OverlayOpacity
     * renderThreshold: only interfaces above this value get rendered. Defaults to 0.01
     * showOriginal: show the original interface as well as alternatives. Defaults to true
     *
     * @param julia
     * @param props extra properties we may have.
     */
    init: function(julia, props) {
        this.julia = julia;
        this.feedbackType = OverlayOpacity;
        this.renderThreshold = 0.01;
        this.showOriginal = true;
        for (var option in props) {
            this[option] = props[option];
        }
    },
    draw: function($el,rootView, alternatives) {

        var me = this;
        // creates a merged UI combining the interface alternatives
        // root: the certain root that we have
        // alternatives: all the alternatives for this item
        var mergeHelper = function(root, alternatives) {
            if(!(root instanceof ContainerView)) {
                // This is not a container, so check if the dirty bit is set for any of the alternatives.
                // If the dirty bit is set, this means that an alternative differs from the base view
                var dirty_vps = [];
                for(var i = 0; i < alternatives.length; i++) {
                    var viewAndProbability = alternatives[i];
                    // Don't render feedback for extremely unlikely things
                    if(viewAndProbability.view._dirty && viewAndProbability.probability > me.renderThreshold) {
                        dirty_vps.push(viewAndProbability);
                    }
                }
                if(dirty_vps.length > 0) {
                    var result = new ContainerView();
                    if(me.showOriginal) {
                        result.addChildView(root);
                    }
                    dirty_vps.forEach(function(vp){
                        result.addChildView(new me.feedbackType(me.julia, vp.view, vp.probability));
                    });
                    return result;
                }
                return root;
            }

            // This is a containerview, so just go through all of the children and recursively merge in alternative views
            // First, check if the number of children match
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

        }
        // merge the interface
        var mergedRoot = mergeHelper(rootView.clone(), alternatives);
        mergedRoot.draw($el);
        return mergedRoot;
    }
});

var OverlayFeedbackBase = View.subClass({
    className: "OverlayFeedbackBase",
    init: function(julia, view, probability) {
        this._super(julia, {});
        this.view = view;
        this.probability = probability;
        if(typeof(window.__julia_snap) === 'undefined') {
            window.__julia_snap = Snap();
        }
    },
    /** Returns a filter that has given grayscale value, rounded to tenth.
     * Grayscale values are cached.
     * @param value
     */
    grayscaleFilterForValue: function(value) {
        var valueToTenth = Math.roundWithSignificance(value, 2);
        if(!window.__julia_snap_filter_grayscale){
            window.__julia_snap_filter_grayscale = {};
        }
        if(!window.__julia_snap_filter_grayscale[valueToTenth]) {
            window.__julia_snap_filter_grayscale[valueToTenth] = window.__julia_snap
                .filter(Snap.filter.grayscale(value))
                .attr({x:0, y:0, width: 1000, height: 1000});
        }
        return window.__julia_snap_filter_grayscale[valueToTenth];
    },
    /**
     * Returns a filter that has a given blur value, rounded to tenth.
     * Values are cached.
     * @param value
     */
    blurFilterForValue: function(value) {
        var valueToTenth = Math.roundWithSignificance(value, 2);
        if(!window.__julia_snap_filter_blur){
            window.__julia_snap_filter_blur = {};
        }
        if(!window.__julia_snap_filter_blur[valueToTenth]) {
            window.__julia_snap_filter_blur[valueToTenth] = window.__julia_snap
                .filter(Snap.filter.blur(value))
                .attr({x:0, y:0, width: 1000, height: 1000});
        }
        return window.__julia_snap_filter_blur[valueToTenth];
    },
    /**
     * Returns a filter that has a given contrast value, rounded to tenth.
     * Values are cached.
     * @param value
     */
    contrastFilterForValue: function(value) {
        var valueToTenth = Math.roundWithSignificance(value, 2);
        if(!window.__julia_snap_filter_contrast){
            window.__julia_snap_filter_contrast = {};
        }
        if(!window.__julia_snap_filter_contrast[valueToTenth]) {
            window.__julia_snap_filter_contrast[valueToTenth] = window.__julia_snap
                .filter(Snap.filter.contrast(value))
                .attr({x:0, y:0, width: 1000, height: 1000});
        }
        return window.__julia_snap_filter_contrast[valueToTenth];
    },
    draw: function($el) {
        throw "OverlayFeedbackBase should be subclassed! Draw() not implemented";
    }

});
/**
 * Renders a child view with opacity according to its probability
 * uses Snap library
 * @type {*}
 */
var OverlayOpacity = OverlayFeedbackBase.subClass({
    className: "OverlayOpacity",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        var p = this.probability;
        var p2 = (Math.log(p + 0.01) + 2) / 2;
        group.attr({opacity: Math.roundWithSignificance(p2, 3)});
//        console.log(p, p2);
        this.view.draw($(group.node), this.probability);
    }
});

/**
 * Renders
 * uses Snap library
 * @type {*}
 */
var OverlayOpacitySaturation = OverlayFeedbackBase.subClass({
    className: "OverlayOpacitySaturation",
    init: function(julia, view, probability) {
        this._super(julia, view, probability);
    },

    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        group.attr({
            opacity: Math.roundWithSignificance(this.probability, 2),
            filter: this.grayscaleFilterForValue(1 - this.probability)
        });
        this.view.draw($(group.node), this.probability);
    }
});



/**
 * Renders items with opacity & grayscale, and optionally an 'outline' view, if present
 * uses Snap library
 * @type {*}
 */
var OverlayOpacitySaturationAmbiguous = OverlayOpacitySaturation.subClass({
    className: "OverlayOpacitySaturationAmbiguous",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        group.attr({
            opacity: Math.roundWithSignificance(this.probability, 2),
            filter: this.grayscaleFilterForValue(1 - this.probability)
        });
        if(typeof(this.view.drawAmbiguous) !== 'undefined') {
            this.view.drawAmbiguous($(group.node));
        } else {
            this.view.draw($(group.node), this.probability);
        }
    }
});

/**
 * Renders items with a scaling factor proportional to likelihood
 * uses Snap library
 * @type {*}
 */
var OverlayScale = OverlayFeedbackBase.subClass({
    className: "OverlayScale",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        var scale = 0.3 +  this.probability;
        var x = this.view.properties.x;
        var y = this.view.properties.y;
        this.view.properties.x = 0;
        this.view.properties.y = 0;
        var p = this.probability;
        var p2 = (Math.log(p + 0.01) + 2) / 2;
        group.attr(
            { transform: "translate(" + (x + this.view.properties.w/2) + " " + (y + this.view.properties.h/2) + ") " + "scale(" + scale + " " + scale + ") " + "translate(" +  -this.view.properties.w / 2 + " " + -this.view.properties.h/2 + ") ",
                opacity: p

            }
        );
        this.view.draw($(group.node));
        this.view.properties.x = x;
        this.view.properties.y = y;
    }
});

/**
 * Renders items with a blur factor proportional to likelihood
 * uses Snap library
 * @type {*}
 */
var OverlayBlur = OverlayFeedbackBase.subClass({
    className: "OverlayScale",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        group.attr({
            filter: this.blurFilterForValue(1 - this.probability)
        });
        this.view.draw($(group.node));
    }
});


/**
 * Renders items with a contrast proportional to likelihood
 * uses Snap library
 * @type {*}
 */
var OverlayContrast = OverlayFeedbackBase.subClass({
    className: "OverlayScale",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        group.attr({
            filter: this.contrastFilterForValue(1 - this.probability)
        });
        this.view.draw($(group.node));
    }
});

/**
 * Renders items with a scaling factor proportional to likelihood
 * uses Snap library
 * @type {*}
 */
var OverlayProgressBar = OverlayFeedbackBase.subClass({
    className: "OverlayProgressBar",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        this.view.draw($(group.node));
        var height = 50;
        var width = 20;
        s.rect(this.view.properties.x - width, this.view.properties.y, width, height).attr({fill: "gray"});
        s.rect(this.view.properties.x - width,
            this.view.properties.y + height * (1 - this.probability), width, height * this.probability).attr({fill: "green"});
    }
});

var OverlayProgressBarLarge = OverlayFeedbackBase.subClass({
    className: "OverlayProgressBar",
    draw: function($el) {
        var s = Snap($el[0]);
        var group = s.group();
        this.view.draw($(group.node));
        var height = 200;
        var width = 50;
        s.rect(this.view.properties.x - width, this.view.properties.y, width, height).attr({fill: "gray"});
        s.rect(this.view.properties.x - width,
            this.view.properties.y + height * (1 - this.probability), width, height * this.probability).attr({fill: "green"});
    }
});


/**
 * Renders a child view with opacity 1
 * uses Snap library
 * @type {*}
 */
var OverlayUnmodified = OverlayFeedbackBase.subClass({
    className: "OverlayUnmodified",
    draw: function($el) {

        var s = Snap($el[0]);
        var group = s.group();
        this.view.draw($(group.node));
    }
});
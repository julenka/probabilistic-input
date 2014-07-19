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
    draw: function($el) {

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
        var mergedRoot = mergeHelper(this.julia.rootView.clone(), this.julia.alternatives);
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
        group.attr({opacity: Math.roundWithSignificance(this.probability, 2)});
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
        // HACK. We set up julia to have a Snap reference so we can get filters

    },
    draw: function($el) {

        var s = Snap($el[0]);
        var group = s.group();
        window.__julia_snap_filter_grayscale = window.__julia_snap.filter(Snap.filter.grayscale(1 - this.probability));
        group.attr({
            opacity: Math.roundWithSignificance(this.probability, 2),
            filter: window.__julia_snap_filter_grayscale
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
        window.__julia_snap_filter_grayscale = window.__julia_snap.filter(Snap.filter.grayscale(1 - this.probability));
        group.attr({
            opacity: Math.roundWithSignificance(this.probability, 2),
            filter: window.__julia_snap_filter_grayscale
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
        group.attr({ transform: "translate(" + x + " " + y + ") " + "scale(" + scale + " " + scale + ") "
        });
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
        window.__julia_snap_filter_blur = window.__julia_snap.filter(Snap.filter.blur(5 * (1 - this.probability)));
        group.attr({
            filter: window.__julia_snap_filter_blur
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
        this.julia.snap_filter_contrast = this.julia.snap.filter(Snap.filter.contrast(this.probability));
        group.attr({
            filter: this.julia.snap_filter_contrast
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
/**
 * Created by julenka on 7/18/14.
 */

/**
 * Draws the last certain state.
 * @type {*}
 */
var RootViewFeedback = Object.subClass({
    className: "RootViewFeedback",
    /**
     * Feedback method that just shows the root view of the interface, no feedback.
     * @param julia
     */
    init: function(julia) {
        this.julia = julia;
    },
    draw: function($el, rootView, alternatives) {
        rootView.draw($el);
        return rootView;
    }
});
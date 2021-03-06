/**
 * Created by julenka on 7/18/14.
 */

var MostLikelyFeedback = Object.subClass({
    className: "MostLikelyFeedback",
    /**
     * Feedback method that just shows the most likely alternative. If no alternatives are present,
     * shows the root view
     * @param julia
     */
    init: function(julia) {
        this.julia = julia;
    },
    draw: function($el, rootView, alternatives) {
        var result = alternatives.length > 0 ? alternatives[0].view : rootView;
        result.draw($el);
        return result;
    }
});

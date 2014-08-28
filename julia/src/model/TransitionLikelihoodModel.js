/**
 * Created by julenka on 8/27/14.
 */

var TransitionLikelihoodModel = Object.subClass({
    className: "TransitionLikelihoodModel",
    init: function() {

    },
    newAction: function(julia_id, transition_id) {},
    likelihoodForTransition: function(julia_id, transition_id) {
        return 1;
    },
    /**
     * if the most recent transition is a, we may want to make b more likely. Add this
     * @param transition_id_a
     * @param transition_id_b
     */
    addEquivalentTransitions: function(transition_id_a, transition_id_b) {
    }
});


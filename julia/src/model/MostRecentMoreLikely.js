/**
 * Created by julenka on 8/27/14.
 */

var MostRecentMoreLikely = TransitionLikelihoodModel.subClass({
    className: "MostRecentMoreLikely",
    init: function(multiplier) {
        this.multiplier = multiplier;
        this.equivalent_transitions = {};
    },
    newAction: function(julia_id, transition_id) {
        this.julia_id = julia_id;
        this.transition_id = transition_id;
    },
    likelihoodForTransition: function(julia_id, transition_id) {
        if(this.julia_id === julia_id &&
            (this.transition_id === transition_id
            || (this.equivalent_transitions[this.transition_id] &&
                this.equivalent_transitions[this.transition_id].indexOf(transition_id) > -1 ))) {
            log(LOG_LEVEL_DEBUG, this.className, "recent transition found, increase multiplier");
            return this.multiplier;
        }
        return 1;
    },
    /**
     * if the most recent transition is a, we may want to make b more likely. Add this
     * @param transition_id_a
     * @param transition_id_b
     */
    addEquivalentTransitions: function(transition_id_a, transition_id_b) {
        if (! (transition_id_a in this.equivalent_transitions)) {
            this.equivalent_transitions[transition_id_a] = [];
        }
        this.equivalent_transitions[transition_id_a].push(transition_id_b);
    }
});
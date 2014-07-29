/**
 * Created by julenka on 7/18/14.
 */

var Mediator = Object.subClass({
    className: "Mediator",
    init: function(){
        // By default, we set the mediation threshold for 0, for now. Demos that want to show mediation
        // can increase this value, or create their own mediator.
        this.mediationThreshold = 0.0;
    },
    /**
     * Mediator takes as input a list of action requests and returns a list of resulting actions to execute
     * By default, all actions are returned and accepted
     * If an action is not accepted, it is deferred for execution later
     * @return Array of mediation replies. Each mediation reply contains a sequence of requests to accept and information
     * @param actionRequestSequences
     * @param nAlternativesToKeep
     */
    mediate: function(actionRequestSequences) {
        if(actionRequestSequences.length === 0) {
            return [];
        }
        if(actionRequestSequences.length === 1) {
            return [new MediationReply(actionRequestSequences[0], true, actionRequestSequences[0].weight)];
        }
        var i;
        var sum = 0;

        actionRequestSequences.forEach(function(seq){
            sum += seq.weight;
        });
        for(i = 0; i < actionRequestSequences.length; i++) {
            actionRequestSequences[i].weight /= sum;
        }

        var finalRequests = [];
        var reversibleRequests = [];
        for(i = 0; i < actionRequestSequences.length; i++) {
            var seq = actionRequestSequences[i];
            seq.weight /= sum;
            if(!(seq.requests[seq.requests.length - 1].reversible)) {
                finalRequests.push(seq);
            } else {
                reversibleRequests.push(seq);
            }
        }
        if(finalRequests.length === 0) {
            return this.mediationReplyFromActionSequences(reversibleRequests);
        }

        var cmp = function(a,b) { return b.weight - a.weight;};
        var finalSorted = finalRequests.sort(cmp);
        var feedbackSorted = reversibleRequests.sort(cmp);

        // finalRequests.length > 0 here
        var w = finalSorted[0].weight;
        var finalShouldBeAccepted = finalSorted.length === 1 || w - finalSorted[1].weight > this.mediationThreshold;
        if(this.mediationThreshold === 0) {

            finalShouldBeAccepted = true;
        }
        if(finalShouldBeAccepted) {

            return [new MediationReply(finalSorted[0], true, finalSorted[0].weight)];
        } else {
            // add deferred action items
            var result = this.mediationReplyFromActionSequences(feedbackSorted);
            result.push(new MediationReply(finalSorted[0], false, finalSorted[0].weight));
            for(var i = 1; i < finalSorted.length && w - finalSorted[i].weight < this.mediationThreshold; i++) {
                result.push(new MediationReply(finalSorted[i], false, finalSorted[i].weight));
            }
            return result;
        }
    },
    mediationReplyFromActionSequences: function(sequences) {
        var result = [];
        sequences.forEach(function(s) {
            result.push(new MediationReply(s, true, s.weight));
        });
        return result;
    }
});

var MediationReply = Object.subClass({
    className: "MediationReply",
    /**
     *
     * @param actionRequestSequence
     * @param accept boolean indicating whether to accept. If not, action gets defered
     * @param probability
     */
    init: function(actionRequestSequence, accept, probability) {
        this.actionRequestSequence = actionRequestSequence;
        this.accept = accept;
        this.probability = probability;
    }
});
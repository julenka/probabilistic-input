
// Check if jquery is loaded. If not, pop up a dialog
if(typeof jQuery === 'undefined') {
    throw{name:"FatalError", message:"Julia requires jQuery! Did you forget to load jQuery?"};
}


//region Julia

//noinspection JSUnusedGlobalSymbols
var Julia = Object.subClass({
    className: "Julia",
    /**
     * Constructor for Julia UI manager
     * properties:
     * nSamplesPerEvent (default 20)
     * nAlternativesToKeep (default 10)
     * mediator default Mediator
     * combiner defautl ActionRequestCombiner
     * @param properties govern properties of probabilistic distach
     *
     */
    init: function(properties) {
        var defaults = {
            nSamplesPerEvent: 20,
            nAlternativesToKeep: 10,
            // minimum probably to keep interface samples around for
            minProbability: 0.01,
            mediator: new Mediator(),
            combiner: new ActionRequestCombiner()
        };
        var key;
        for(key in properties) {
            this[key] = properties[key];
        }
        for(key in defaults) {
            if(!(key in this)) {
                this[key] = defaults[key];
            }
        }
        // [{viewRoot, event}, {viewRoot, event}]
        this.dispatchQueue = [];
        // [{view:...,probability:...},...]
        this.alternatives = [];
        this.eventSources = [];
        this.mouseX = this.mouseXSmooth = 0;
        this.mouseY = this.mouseYSmooth = 0;

        window.setInterval(bind(this,"intervalUpdate"), 30);

        this.mostLikelyFeedback = new MostLikelyFeedback(this);
        log(LOG_LEVEL_VERBOSE, "Julia initialized", this);

    },
    //TODO test addEventSource
    addEventSource: function(eventSource) {
        eventSource.addListener(bind(this, "dispatchPEvent"));
        this.eventSources.push(eventSource);
    },

    clearEventSources: function(){
        this.eventSources.forEach(function(es){ es.removeEventListeners()});
    },
    removeEventSource: function(eventSource) {
          eventSource.removeEventListeners();
    },
    /**
     * populate the dispatch queue with interface alternatives and event samples.
     * Cross product of interfaces and events
     * Assumes that dispatchQueue is empty initially
     * @param pEvent the event to initialize the dispatch queue with
     */
    initDispatchQueue: function(pEvent) {
        var i,j;
        var samples = pEvent.getSamples(this.nSamplesPerEvent);
        if(this.dispatchQueue.length !== 0) {
            throw({name: "FatalError", message: "initDispatchQueue dispatchQueue not empty!"});
        }
        for(i = 0; i < samples.length; i++) {
            samples[i].sample_index = i;
            for (j = 0; j < this.alternatives.length; j++) {
                this.addToDispatchQueue(this.alternatives[j], samples[i]);
            }
        }
    },
    addToDispatchQueue: function(viewAndProbability, event) {
        this.dispatchQueue.push({
            viewAndProbability: viewAndProbability,
            eventSample: event
        });
    },
    setRootView: function(view) {
        if(!(view instanceof ContainerView)) {
            throw "root view not instance of ContainerView!";
        }
        this.rootView = view;
        this.rootView.resetDirtyBit();
        this.alternatives = [{view: view, probability: 1}];
        this.__julia_ambiguous = false;
    },
    /**
     * Remove given view from list of alternatives
     * @param view
     */
    killAlternative: function(view) {
        for (var i = 0; i < this.alternatives.length; i++) {
            var alternative = this.alternatives[i].view;
            if(alternative === view) {
                this.alternatives = this.alternatives.splice(i, 1);
            }
        }
    },
    intervalUpdate: function() {
        var curTime = new Date().getTime();
        var dtMs = curTime - this.lastUpdate;
        if(dtMs) {
            if(typeof(this.lastMouseX) !== 'undefined') {
                this.dx = this.mouseX - this.lastMouseX;
                this.dy = this.mouseY - this.lastMouseY;
                var newSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
                this.speed = this.speed * 0.8 + (newSpeed - this.speed) * 0.2;
            }
        } else {
            this.speed = 10;
        }
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.lastUpdate =  curTime;
    },
    updateMouse: function(pEvent) {
        if(pEvent.type === 'mousemove') {


            this.mouseX = pEvent.element_x;
            this.mouseY = pEvent.element_y;

            var smoothFactor = 0.97;
            this.mouseXSmooth = this.mouseXSmooth + (1 - smoothFactor) * (this.mouseX - this.mouseXSmooth);
            this.mouseYSmooth = this.mouseYSmooth + (1 - smoothFactor) * (this.mouseY - this.mouseYSmooth);

        }
        if(pEvent.type === 'mousedown') {
            this.downX = pEvent.element_x;
            this.downY = pEvent.element_y;
            this.mouseXSmooth = pEvent.element_x;
            this.mouseYSmooth = pEvent.element_y;
            this.speed = 10;
            this.dwellTriggered = false;
        }

    },
    /**
     * Dispatch the events currently in the dispatch queue
     * @return whether the ui was updated or not
     */
    dispatchEventsInQueue: function(){
        var i;
        var actionRequests = [];
        var alternativesDispatchedTo = [];
        while(this.dispatchQueue.length !== 0) {
            var viewAndEvent = this.dispatchQueue.shift();
            var requestsFromView = viewAndEvent.viewAndProbability.view.dispatchEvent(viewAndEvent.eventSample);
            requestsFromView.forEach(function(seq) {
                seq.weight *= viewAndEvent.viewAndProbability.probability * viewAndEvent.eventSample.identity_p ;
            });
            actionRequests.extend(requestsFromView);

            // TODO: make a set class
            if($.inArray(viewAndEvent.viewAndProbability.view, alternativesDispatchedTo) === -1) {
                alternativesDispatchedTo.push(viewAndEvent.viewAndProbability.view);
            }
        }
        actionRequests = this.combiner.combine(actionRequests);
        var mediationResults = this.mediator.mediate(actionRequests);
        var newAlternatives = this.updateInterfaceAlternatives(mediationResults);
        if(!newAlternatives) {
            // The mediation includded some deferred results, dispatch has been deferred
            return;
        }
        var combinedAlternatives = this.combineInterfaceAlternatives(newAlternatives);

        if(combinedAlternatives.length > 0) {
            // If we have any new updated interfaces, we want to make sure that any interfaces
            // that were not actually dispatched to are still around.
            // Therefore, append all alternatives that were not in the queue to the combined list
            // This is a special case for when the dispatch queue does not actually contain all alternative interfaces,
            // such as when a particular interface, after receiving an event, raises a new event which it adds to the dispatch queue
            // They will then be combined and downsampled

            for(i = 0; i < this.alternatives.length; i++) {
                if($.inArray(this.alternatives[i].view, alternativesDispatchedTo) === -1) {
                    combinedAlternatives.push(this.alternatives[i]);
                }
            }
        }


        var downsampledAlternatives = this.downSampleInterfaceAlternatives(
            combinedAlternatives,
            this.nAlternativesToKeep);
        if(downsampledAlternatives.length > 0) {
            if(downsampledAlternatives.length === 1) {
                // there is only one alternative, set a new root view.
                this.setRootView(downsampledAlternatives[0].view);
            } else {
                this.alternatives = downsampledAlternatives;
            }

        }
        return downsampledAlternatives.length > 0;
    },
    dispatchPEvent: function(pEvent) {
        this.updateMouse(pEvent);
        // HACKS
        if(this.__julia_dont_dispatch) {
            return;
        }

        this.initDispatchQueue(pEvent);

        var uiUpdated = false;
        while(this.dispatchQueue.length > 0) {
            uiUpdated = this.dispatchEventsInQueue() || uiUpdated;
        }

        // The mediator automatically resamples the views
        if(this.dispatchCompleted) {
            this.dispatchCompleted(this.alternatives, uiUpdated, pEvent);
        }
    },
    /**
     * For now, at the end of the dispatch loop, we will draw feedback to the given elements
     * TODO: when constructed, we shoudl probably specify the element to draw to
     * @param $el
     */
    drawFeedback: function($el, feedback) {
        if(this.dwellForFeedback && this.speed > 0.1 && !this.dwellTriggered) {
            return this.mostLikelyFeedback.draw($el, this.rootView, this.alternatives);
        }

        this.dwellTriggered = true;
        return feedback.draw($el, this.rootView, this.alternatives);
    },
    /**
     * Updates the interface alternatives given a list of mediation results (from the mediator)
     * Does not aggregate similar interfaces
     * @param mediationResults
     * @return {Array} list of the new alternatives which are a result of executing the action requests
     */
    updateInterfaceAlternatives: function(mediationResults, pEvent) {
        // Update interface alternatives based on mediation results
        var newAlternatives = [], mediationReply, viewClone;
        var deferred = [];
        var i;
        for(i = 0; i < mediationResults.length; i++) {
            mediationReply = mediationResults[i];

            var modifiedViews = [];
            var hasFinalAction = false;
            // for each action request, in order to properly move over the viewContext to the clone,
            // we need to let each view know about all requests that came from it. Then it can appropriately
            // update the viewContext for each request when the view gets cloned.
            mediationReply.actionRequestSequence.requests.forEach(function(request) {
                var viewContext = request.viewContext;
                if(viewContext.actionRequests === undefined) {
                    viewContext.actionRequests = [];
                }
                viewContext.actionRequests.push(request);
                modifiedViews.push(viewContext);
            });

            viewClone = mediationReply.actionRequestSequence.rootView.clone();
            viewClone.kill = undefined;
            mediationReply.actionRequestSequence.requests.forEach(function(request){
                if(!request.reversible) {
                    hasFinalAction = true;
                }
                // TODO: this only works if there is only one container. Figure out how to handle multiple containers
                var oldCount = viewClone.children.length;
                request.fn.call(request.viewContext, request.event, viewClone);
                // set the viewContext dirty bit
                request.viewContext._dirty = true;
                if(viewClone.children.length !== oldCount) {
                    viewClone._dirty = true;
                }
            });

            if((typeof viewClone.kill) === 'undefined') {
                if(mediationReply.accept) {
                    newAlternatives.push({view: viewClone, probability: mediationReply.probability});
                } else {
                    deferred.push({view: viewClone, probability: mediationReply.probability});
                }

            }

            // since different action request sequences may be possible for the same view, we need to
            // remove the action request information for each view after we perform the clone and update
            modifiedViews.forEach(function(view){
                view.actionRequests = undefined;
            });
            // If this action request sequence had a final action, set the new root view, and return
            if(hasFinalAction && (typeof viewClone.kill) === 'undefined' && mediationReply.accept) {
                newAlternatives.slice(0, newAlternatives.length - 1);
                return newAlternatives;
            }

            // TODO decide what to do for requests that are not accepted (deferred) For now, do nothing.
        }

        // TODO: show N best list
        if(deferred.length > 0) {
            var logLevel = LOG_LEVEL_DEBUG;

            var combinedAlternatives = this.combineInterfaceAlternatives(deferred);
            var downsampledAlternatives = this.downSampleInterfaceAlternatives(
                combinedAlternatives,
                this.nAlternativesToKeep);
            this.__julia_ambiguous = true;
            this.ambiguousRequests(downsampledAlternatives, pEvent);
            return false;
        }

        return newAlternatives;
    },
    compareAlternatives: function(a,b) {
        return b.probability - a.probability;
    },

    /**
     * ***This modifies the input array***
     * Combines similar alternative interfaces.
     * Takes as input a list of interface alternatives, and their weights.
     * Combines similar interfaces, and returns a new list containing these reduces interfaces
     * TODO make the combination method modular
     * @param interfaceAlternatives the initial, non-combined list of alternatives
     * @returns {Array} A list of
     */
    combineInterfaceAlternatives: function(interfaceAlternatives) {
        if(interfaceAlternatives.length === 0) {
            return [];
        }
        var combinedAlternatives = [], i;
        combinedAlternatives[0] = interfaceAlternatives.shift();
        while(interfaceAlternatives.length > 0) {
            var alternative = interfaceAlternatives.shift();
            var found = false;
            for(i = 0; i < combinedAlternatives.length && !found; i++) {
                if(alternative.view.equals(combinedAlternatives[i].view)) {
                    combinedAlternatives[i].probability += alternative.probability;
                    found = true;
                }
            }
            if(!found) {
                combinedAlternatives.push(alternative);
            }
        }
        return combinedAlternatives;
    },
    /**
     * ***This method modifies the input newAlternatives array***
     * Given a list of interface alternatives (and their probabilities), downsamples this list to a smaller list
     * of maxAlternatives interface alternatives.
     *
     * This particular algorithm just sorts the alternatives by probability and picks the top maxAlternatives
     * interfaces.
     *
     * TODO make this more modular
     * @param newAlternatives
     * @param n maximum number of alternatives to keep
     * @returns {Array} the downsampled interface alternatives
     */
    downSampleInterfaceAlternatives: function(interfaceAlternatives, n) {
        var sortedAlternatives = interfaceAlternatives.sort(function(a,b) {
            return b.probability - a.probability;
        });
        var result = sortedAlternatives.splice(0, n);
        var sum = 0;
        result.forEach(function(alternative) {
            sum += alternative.probability;
        });
        result.forEach(function(alternative){
            alternative.probability = alternative.probability / sum;
        });
        var me = this;
        return result.filter(function(x) {
            return x.probability > me.minProbability;
        });
    },

    /**
     * Draws all current interface alternatives to the DOM, into Snap objects
     * Assumes that julia.css is included
     * Also assumes that all elements are drawnt to a Snap element
     * This is a utility function
     * TODO: fix this to work with any DOM element, or decide that you're using SVGs
     * @param $el
     * @param snap_width the original width of the snap
     * @param snap_eight the original height of the snap
     * @param snap_scale the amount to scale the snap by
     */
    dumpAlternativesAsSnap: function($el, snap_width, snap_height, snap_scale, on_click) {
        $el.empty();
        var me = this;

        var d = $("<div class='float-left'></div>");
        d.append(["<div>","root", "</div>"].join(" "));

        var s = Snap(snap_width * snap_scale, snap_height * snap_scale);
        var s_dom = s.node;
        s_dom.setAttribute("viewBox", [0, 0, snap_width, snap_height].join(" "));
        d.append(s_dom);
        this.rootView.draw($(s_dom));
        $el.append(d);

        this.alternatives.forEach(function(view_probability, i) {
            var d = $("<div class='float-left'></div>");

            d.append(["<div>","i", i, ":", Math.roundWithSignificance(view_probability.probability, 2), "</div>"].join(" "));
            var s = Snap(snap_width * snap_scale, snap_height * snap_scale);
            var s_dom = s.node;
            s_dom.setAttribute("viewBox", [0, 0, snap_width, snap_height].join(" "));
            d.append(s_dom);
            view_probability.view.draw($(s_dom));
            $el.append(d);
            d.click(function(){
                me.setRootView(view_probability.view);
                if(typeof on_click !== 'undefined') {
                    on_click();
                }
            });
        });
    },

    dumpAlternativesAsText: function($el) {
        $el.empty();


        this.alternatives.forEach(function(view_probability, i){
            var d = $("<div class='float-left'></div>");
            d.append(["<div>","i", i, ":", Math.roundWithSignificance(view_probability.probability, 2), "</div>"].join(" "));
            view_probability.view.domDump(d);
            $el.append(d);
        });
    }

});

//endregion


//region Mediation and Action Combination
/**
 * ActionRequestCombiner is responsible for combining multiple action request sequences, and updating the weights
 * of sequences accordingly
 */
var ActionRequestCombiner = Object.subClass({
    className: "ActionRequestCombiner",
    /**
     * Constructor for combiner class
     */
    init: function(){},

    /**
     * Combine multiple action request sequences, updating weights accordingly.
     * Default implementation returns original action request sequence.
     * @returns {Array} The collection of combind ActionRequestSequence objects
     * @param actionRequestSequences
     */
    combine: function(actionRequestSequences) {
        if(actionRequestSequences.length === 0) {
            return [];
        }
        // compare request. rootView
        // compare the code of every action request, and the .event of each actionrequest
        var result = [actionRequestSequences[0]];
        var i,j;

        for(i = 1; i < actionRequestSequences.length; i++) {
            var found = false;
            for(j = 0; j < result.length && !found; j++) {
                // equivalence
                if(this.sequencesAreEqual(actionRequestSequences[i], result[j])) {
                    result[j].weight += actionRequestSequences[i].weight;
                    found = true;
                }
            }
            if(!found) {
                result.push(actionRequestSequences[i]);
            }
        }
        return result;
    },

    /**
     * Determines whether two action request sequences are equal
     * @param a
     * @param b
     * @return boolean Whether sequences a and b are equal
     */
    sequencesAreEqual: function(a,b) {

        if(a.rootView !== b.rootView) {
            return false;
        }
        if(a.requests.length !== b.requests.length) {
            return false;
        }
        for(var i = 0; i < a.requests.length; i++) {
            var aReq = a.requests[i];
            var bReq = b.requests[i];

            if(!aReq.equals(bReq)) {
                return false;
            }
        }
        return true;

    }
});

//endregion

/**
 * Created by julenka on 7/18/14.
 */

/** Feedback object that picks other feedback objects based on ids specified **/

var MetaFeedback = Object.subClass({
    className: "MetaFeedback",
    init: function(julia, props) {
        this.julia = julia;
        this.feedbackMap = {};
    },
    draw: function($el, rootView, alternatives) {
        // for every element in the feedback map
        for(var key in this.feedbackMap) {
            var new_rootView;
            var feedback = this.feedbackMap[key];
            var new_alternatives = [];
            if(key === 'default') {
                // 'default' specifies the default feedback type to use.
                // If a view does not have a particular id, it uses this.
                new_rootView = rootView.clone();
                var me = this;
                function prune(root){
                    for(var i = 0; i < root.children.length; i++) {
                        var child = root.children[i];
                        if (child instanceof ContainerView) {
                            prune(child);
                        } else {
                            if(child.__julia_id in me.feedbackMap) {
                                // if the child id is in the feedback map, it is being rendered by some other feedback
                                root.children.splice(i, 1);
                            }
                        }
                    }
                }
                prune(new_rootView);
                for(var i = 0; i < alternatives.length; i++) {
                    var new_alternative = {};
                    new_alternative.probability = alternatives[i].probability;
                    new_alternative.view = alternatives[i].view.clone();
                    prune(new_alternative.view);
                    new_alternatives.push(new_alternative);
                }
            } else {
                var child = rootView.findViewById(key);
                // ASSUMPTION: child is always a valid ID
                if(typeof(child) === 'undefined') {
                    throw("MetaFeedback cannot find view with id " + key);
                }


                new_rootView = new ContainerView();
                new_rootView.addChildView(child);

                // create a new set of alternatives that we will add to a fake julia
                // these are all of the fields that the meta feedback wants
                for(var i = 0; i < alternatives.length; i++) {
                    var alternative_view = alternatives[i].view;
                    var new_alternative_root = new ContainerView();
                    var new_alternative = {};
                    new_alternative.probability = alternatives[i].probability;
                    var new_child = alternative_view.findViewById(key);
                    new_alternative_root.addChildView(new_child);
                    new_alternative.view = new_alternative_root;
                    new_alternatives.push(new_alternative);
                }
            }
            feedback.draw($el, new_rootView, new_alternatives);
        }
    }
});
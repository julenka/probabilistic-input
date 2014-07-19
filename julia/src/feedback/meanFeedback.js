/**
 * Created by julenka on 7/18/14.
 */

/** Aggregate properties of alternate views and compute mean for numeric values **/

var MeanFeedback = View.subClass({
    className: "MeanFeedback",
    init: function(julia) {
        this.julia = julia;
    },
    draw: function($el) {


        // loop over all alternatives
        // have a 'concatenatedRoot'
        // concatenate the current interface with the current interface
        var concatenatedRoot = undefined;

        var concatenate = function(acc, other) {
            var i = undefined;
            if(typeof(acc) === 'undefined') {
                if(!(other instanceof ContainerView)) {
                    acc = other.clone();
                    for(var prop in acc.properties) {
                        if(typeof(acc.properties[prop]) !== 'function') {
                            var tmp = acc.properties[prop];
                            acc.properties[prop] = [tmp];
                        }
                    }
                } else {
                    return new ContainerView();
                }
                return acc;
            }
            if(other instanceof ContainerView) {
                var child = undefined, other_child = undefined, acc_child = undefined;
                for(i = 0; i < acc.children.length; i++) {
                    child = acc.children[i];
                    other_child = other.findViewById(child.__julia_id);
                    if(other_child) {
                        acc.children[i] = concatenate(child, other_child);
                    }
                }
                for(i = 0; i < other.children.length; i++) {
                    other_child = other.children[i];
                    acc_child = acc.findViewById(other_child.__julia_id);
                    if(!acc_child) {
                        acc.addChildView(concatenate(undefined, other_child))

                    }
                }
            } else {
                for(var prop in other.properties) {
                    acc.properties[prop].push(other.properties[prop]);
                }
            }
            return acc;
        };
        for(var i = 0; i < this.julia.alternatives.length; i++) {
            // TODO: concatenate with probabilities here
            concatenatedRoot = concatenate(concatenatedRoot, this.julia.alternatives[i].view);
        }

        var reduce = function(root) {
            if(root instanceof ContainerView) {
                for(var i = 0; i < root.children.length; i++) {
                    reduce(root.children[i]);
                }
            } else if(root.properties) {
                for(var prop in root.properties) {
                    var prop_list = root.properties[prop];
                    var first = prop_list[0];
                    if(typeof(first) === 'number') {
                        var mean = first;
                        for(var j = 1; j < prop_list.length; j++) {
                            mean += prop_list[j];
                        }
                        // TODO: weight according to likelihood so that we get expected value here
                        mean /= prop_list.length;
                        root.properties[prop] = mean;
                    } else {
                        // If the value is not a number, we will, for now, naively just take the first value
                        // In the future we should take the object with the highest count.
                        root.properties[prop] = first;
                    }
                }
            }
        }
        // take the average value of every property (if it is a nubmer), otherwise get the first property
        reduce(concatenatedRoot);
        concatenatedRoot.draw($el);
        return concatenatedRoot;
    }
});
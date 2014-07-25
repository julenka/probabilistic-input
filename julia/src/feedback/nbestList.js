/**
 * Created by julenka on 7/18/14.
 */

/** Collection of various objects for rendering N best Lists and their variations **/

NBestListBase = Object.subClass({
    className: "NBestListBase",
    /**
     * Given a set of alternate interfaces, renders an N-best list.
     * All n best list feedbacks extend this
     *
     * Properties:
     * n: number of alternatives to consider
     * dp: maximum difference in probability from the most likely interface to consider.
     * n_best_location: function that returns x,y of location to put n-best list
     * n_best_size: function that returns the size of each item in the n_best_list
     * feedback_type: Container type (NBestGate or NBestContainer) default: NBestContainer
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this.julia = julia;
        this.nAlternatives = valueOrDefault(props.n, 3);
        this.dp = valueOrDefault(props.dp, 0.5);
        this.feedback_type = valueOrDefault(props.feedback_type, NBestContainer);
        this.probability_mode = valueOrDefault(props.probability_mode, "none");
        this.dont_dispatch_when_visible = valueOrDefault(props.dont_dispatch_when_visible, true);
        this.show_root_instead_of_most_likely = valueOrDefault(props.show_root_instead_of_most_likely, true);

        this.n_best_size = valueOrDefault(props.n_best_size, 80);
        this.n_best_location = valueOrDefault(props.n_best_location, function(){
            return {x: this.julia.mouseXSmooth - this.n_best_size, y: this.julia.mouseYSmooth - this.n_best_size * 1.25};
        });
    },
    addItemToNBestContainer: function(nbestcontainer, originalRoot, alternativeRoot, probability) {
        throw "addItemToNBestContainer is not implemented in NBestListBase. Needs to be filled in by extending class.";
    },
    draw: function ($el) {
        // TODO: I think we can refactor this
        $el.off("mousedown touchstart");
        delete this.julia.__julia_dont_dispatch;
        if(this.julia.alternatives.length === 0) {
            this.julia.rootView.draw($el);
            return this.julia.rootView;
        }
        // for now, this will only work for one container, at the root.
        // TODO: make this work at multiple levels

        // we are only going to be showing the top 3 interfaces
        // and only if they are withing dp of the most likely
        var most_likely = this.julia.alternatives[0];
        var max_p = most_likely.probability;

        var mergedRoot = this.show_root_instead_of_most_likely ? this.julia.rootView.clone() : most_likely.view.clone();
        var root = this.julia.rootView;
        var nbestcontainer = new this.feedback_type(this.julia,
            $.extend(this.n_best_location(), {alternative_size: this.n_best_size, probability_mode: this.probability_mode})
        );
        for(var i = this.show_root_instead_of_most_likely ? 0 : 1;
            i < Math.min(this.nAlternatives + 1,
                this.julia.alternatives.length); i++) {
            if(i == 0 && this.julia.alternatives.length == 1) {
                continue;
            }
            var p = this.julia.alternatives[i].probability;
            var v = this.julia.alternatives[i].view;
            if(max_p - p > this.dp) {
                break;
            }
            this.addItemToNBestContainer(nbestcontainer, root, v, p);
        }
        if(nbestcontainer.alternatives.length > 0) {
            mergedRoot.addChildView(nbestcontainer);
            // HACKS
            if(this.dont_dispatch_when_visible) {
                this.julia.__julia_dont_dispatch = true;
            }
            var julia = this.julia;
            $el.on("mousedown touchstart", function(e){
                julia.setRootView(most_likely.view);
                delete julia.__julia_dont_dispatch;
                julia.dispatchPEvent(new PMouseEvent(1, e, 10, 10, 'mousedown', e.currentTarget));
                julia.dispatchCompleted(julia.alternatives, true);
                $el.off("mousedown touchstart");
            });
        }

        mergedRoot.draw($el);

        return mergedRoot;
    }
});

var NBestHighlightFeedback = NBestListBase.subClass({
    className: "NBestHighlightFeedback",
    /**
     * Given a set of alternate interfaces.
     * For the N most likely alternatives:
     *   pick the most likely alternative and render this
     *
     * then renders all alternatives up to n and dp
     * highlighting different children
     *
     * Properties:
     * n: number of alternatives to consider
     * dp: maximum difference in probability from the most likely interface to consider.
     * highlight_color: color to use for highlight. default is yellow
     * feedback_type: Container type (NBestGate or NBestContainer) default: NBestContainer
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props);
        this.highlight_color = valueOrDefault(props.highlight_color, "#ea4c88");
    },
    addItemToNBestContainer: function(nbestcontainer, originalRoot, alternativeRoot, probability) {
        var new_container = new ContainerView(this.julia);
        for(var j = 0; j < alternativeRoot.children.length; j++) {
            // Let's just get the case working where we have different children, then worry about 'dirty' children
            var child = alternativeRoot.children[j];
            if( child._dirty || typeof(originalRoot.findViewById(child.__julia_id)) === 'undefined') {
                var highlight_container = new HighlightView(this.julia, child, this.highlight_color);
                new_container.addChildView(highlight_container);
            } else {
                new_container.addChildView(child);
            }
        }
        nbestcontainer.addAlternative(alternativeRoot, new_container, probability);
    }
});

var HighlightView = View.subClass({
    className: "HighlightView",
    init: function(julia, child, color) {
        this._super(julia);
        this.highlight_color = color;
        this.padding = 10;
        this.child = child;
    },
    draw: function($el) {
        var s = Snap($el[0]);
        var g = s.group();
        this.child.draw($(g.node));
        var bbox = g.getBBox();
        g.rect(bbox.x - this.padding, bbox.y - this.padding, bbox.w + 2 * this.padding, bbox.h + 2 * this.padding)
            .attr({fill: this.highlight_color, "fill-opacity": 0.25});
    },
    clone: function() {
        return new HighlightView(this.julia, this.child, this.highlight_color);
    }
});

/**
 * N best list for the entire UI
 */
var NBestUIFeedback = NBestListBase.subClass({
    className: "NBestUIFeedback",
    /**
     * Given a set of alternate interfaces.
     * For the N most likely alternatives:
     *   pick the most likely alternative and render this
     *
     *   then render all other alternatives (within the specified dp and n constraints) near the mouse
     * Properties:
     * n: number of alternatives to consider
     * dp: maximum difference in probability from the most likely interface to consider.
     * n_best_location: function that returns x,y of location to put n-best list
     * n_best_size: function that returns the size of each item in the n_best_list
     * feedback_type: Container type (NBestGate or NBestContainer) default: NBestContainer
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props);
    },
    addItemToNBestContainer: function(nbestcontainer, originalRoot, alternativeRoot, probability) {
        nbestcontainer.addAlternative(alternativeRoot, alternativeRoot, probability);
    }
});

var NBestFeedback = NBestListBase.subClass({
    className: "NBestFeedback",
    /**
     * Given a set of alternate interfaces.
     * For the N most likely alternatives:
     *   pick the most likely alternative and render this
     *
     *   then, if any alternative contains a child that is not in the root view, adds the child to an 'n-best list'
     *   that the user can later click on to chose the appropriate alternative
     * Properties:
     * n: number of alternatives to consider
     * dp: maximum difference in probability from the most likely interface to consider.
     * feedback_type: Container type (NBestGate or NBestContainer) default: NBestContainer
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props);
    },
    addItemToNBestContainer: function(nbestcontainer, originalRoot, alternativeRoot, probability) {
        var dirty_children = [];
        for(var j = 0; j < alternativeRoot.children.length; j++) {
            var child = alternativeRoot.children[j];
            if( child._dirty || typeof(originalRoot.findViewById(child.__julia_id)) === 'undefined') {
                dirty_children.push(child);
            }

        }

        if(dirty_children.length > 0) {
            var dirty_children_container = new ContainerView(this.julia);
            dirty_children.forEach(function(dirty_child){
                dirty_children_container.addChildView(dirty_child);
            });
            nbestcontainer.addAlternative(alternativeRoot, dirty_children_container, probability);
        }
    }
});


var NBestContainer = View.subClass({
    className: "NBestContainer",
    /**
     * Represents an alternative in an n best list
     * when clicked, set this to be the alternative view of the interface
     * properties:
     * x
     * y
     * padding
     * alternative_size (the size of each alternative)
     * @param julia
     * @param props
     */
    init: function(julia, props ) {
        var defaults = {x: 0, y:0, w: 0, h: 0, alternative_size: 50, padding: 8, probability_mode: "none"};
        this._super(julia, props, defaults);
        // [ {root: xxx, view: xxx, probability}]
        this.alternatives = [];


    },
    /**
     * Draws one alternative in a smaller region
     * return the group that was drawn to
     * x: x position
     * y: y position
     * s: snap
     */
    drawSmallAlternative: function(x, y, s, viewCopy, p) {

        var w = this.properties.alternative_size;
        var boundingRect = s.rect(x - 2, y- 2, w + 4, w + 4).attr({"stroke": "gray", "stroke-width": "1px",
            "fill-opacity": 0.9, fill: "#FFF"});
        var clippingRect = boundingRect.clone();
        var clippingGroup = s.group();
        var g = clippingGroup.group();
        var bbox2 = boundingRect.getBBox();

        var m = new Snap.Matrix();

        this.updateViewCopy(viewCopy, bbox2);
        viewCopy.properties.x = 0;
        viewCopy.properties.y = 0;
        if(this.properties.probability_mode === "opacity") {
            var overlayContainer = new OverlayOpacity(this.julia, viewCopy,p);
            overlayContainer.draw($(g.node));
        } else {
            viewCopy.draw($(g.node));
        }

        var bbox = g.getBBox();
        this.updateBBoxForAlternativeView(bbox);

        var dx = bbox2.cx - bbox.cx;
        var dy = bbox2.cy - bbox.cy;


        g.rect(bbox.x, bbox.y, bbox.w, bbox.h)
            .attr({"fill": "blue", "fill-opacity": 0.0});

        var scale = this.properties.alternative_size / Math.max(bbox.w, bbox.h);
        m.translate(dx, dy);
        m.scale(scale, scale, bbox.cx, bbox.cy);

//        var alternative_opacity = this.properties.probability_mode === "opacity" ? p : 1;
        g.attr({transform: m.toString()});
        clippingGroup.attr({"clip-path": clippingRect});
        return clippingGroup;
    },
    /**
     * In some cases, we may want to update an alternative (e.g. with a future event) before displaying it.
     * This method allows extending classes to do so.
     * @param viewCopy
     * @param bbox
     */
    updateViewCopy: function(viewCopy, bbox) {
        return;
    },
    /**
     * We may want to adjust the size of the bounding box given an alterantive.
     * This function allows extending classes to do so.
     * @param bbox
     */
    updateBBoxForAlternativeView: function(bbox) {
        var bbox_pad = 5;
        bbox.x -= bbox_pad;
        bbox.y -= bbox_pad;
        bbox.w += bbox_pad * 2;
        bbox.h += bbox_pad *2;
    },

    draw: function($el) {
        var s = Snap($el[0]);
        var w = this.properties.padding + this.alternatives.length * (this.properties.alternative_size + this.properties.padding);
        var h = 2 * this.properties.padding + this.properties.alternative_size;
        s.rect(this.properties.x, this.properties.y, w, h).attr({
            "stroke": "black",
            "stroke-width": "1px",
            fill: "#313131",
            opacity: 0.5,
        });
        // HACK: this will remove all handlers attached with on and needs to be improved
        $(window).off("keypress");
        var julia = this.julia;
        var keypressHandlers = [];
        for(var i = 0; i < this.alternatives.length; i++) {
            var x = this.properties.x + this.properties.padding + i * (this.properties.alternative_size + this.properties.padding);
            var y = this.properties.y + this.properties.padding;
            var g = this.drawSmallAlternative(x, y, s, this.alternatives[i].view.clone(), this.alternatives[i].probability);
            var altRoot = this.alternatives[i].root;
            // returns a function taht sets the root view for julia to be the input value
            // JavaScript closures are function level, not scope level.
            // this means that the enclosign scope is assigned when the function is invoked.
            // We need to therrefore create a custom event handler that sets the root view to altRoot
            // by explicitly calling the function here.
            // Otherwise altrot will always be the last element.
            // Explanation at http://stackoverflow.com/questions/1451009/javascript-infamous-loop-issue
            var onDownHandlerForAlternative = function(alternative) {
                return function(e){
                    julia.setRootView(alternative);
                    delete julia.__julia_dont_dispatch;

                    julia.dispatchCompleted(julia.alternatives, true);
                    e.stopPropagation();
                    $(g.node).off("mousedown touchstart");
                    $el.off("mousedown touchstart");
                    return true;
                };
            };
            $(g.node).on("mousedown touchstart", onDownHandlerForAlternative(altRoot));
            keypressHandlers.push(onDownHandlerForAlternative(altRoot));
        }
        $(window).on("keypress", function(e) {

            // http://stackoverflow.com/questions/10868006/trying-to-get-numbers-from-keypress-document-javascript
            var key = e.keyCode || e.charCode;
            console.log("pressed", key - 48);
            if(key >= 48 && key <=57) {
                keypressHandlers[key - 48 - 1](e);
            }
        });
    },
    /**
     * Adds an alternative to the list of items we are going to present.
     * @param alternative
     * @param view_to_render
     */
    addAlternative: function(alternative_root, view, probability) {
        this.alternatives.push({root: alternative_root, view: view, probability: probability});
    },
    clone: function() {
        var result = this._super();
        result.alternatives = deepClone(this.alternatives);
    }
});

var NBestGate = NBestContainer.subClass({
    className: "NBestGate",
    init: function(julia, props) {
        this._super(julia, props);
    },
    draw: function($el) {
        $el.off("mousemove touchmove mouseup touchup");
        // HACK: this will remove all handlers attached with on and needs to be improved
        $(window).off("keypress");
        var s = Snap($el[0]);
        var w = this.properties.padding + this.alternatives.length * (this.properties.alternative_size + this.properties.padding);
        var h = 2 * this.properties.padding + this.properties.alternative_size;

        var julia = this.julia;
        var keypressHandlers = [];
        for(var i = 0; i < this.alternatives.length; i++) {
            var x = this.properties.x + this.properties.padding + i * (this.properties.alternative_size + this.properties.padding) - w / 2;


            var y = this.properties.y + this.properties.padding;

            var g = this.drawSmallAlternative(x, y, s, this.alternatives[i].view, this.alternatives[i].probability);

            var altRoot = this.alternatives[i].root;
            // returns a function taht sets the root view for julia to be the input value
            // JavaScript closures are function level, not scope level.
            // this means that the enclosign scope is assigned when the function is invoked.
            // We need to therrefore create a custom event handler that sets the root view to altRoot
            // by explicitly calling the function here.
            // Otherwise altrot will always be the last element.
            // Explanation at http://stackoverflow.com/questions/1451009/javascript-infamous-loop-issue
            var onMoveHandlerForAlternative = function(alternative) {
                return function(e){
                    julia.setRootView(alternative);
                    delete julia.__julia_dont_dispatch;
                    if(julia.dispatchCompleted) {
                        julia.dispatchCompleted(julia.alternatives, true);
                    }

                    e.stopPropagation();
                    return true;
                };
            };
            $(g.node).on("mousemove touchmove", onMoveHandlerForAlternative(altRoot));

            keypressHandlers.push(onMoveHandlerForAlternative(altRoot));
        }
        $(window).off("keypress");
        $(window).on("keypress", function(e) {

            // http://stackoverflow.com/questions/10868006/trying-to-get-numbers-from-keypress-document-javascript
            var key = e.keyCode || e.charCode;
            console.log("pressed", key - 48);
            if(key >= 48 && key <=57) {
                keypressHandlers[key - 48 - 1](e);
            }
        });
        $el.on("mousemove touchmove mouseup touchup", function(e) {
            delete julia.__julia_dont_dispatch;
            julia.dispatchPEvent(new PMouseEvent(1, e, 0, 0, e.type, e.currentTarget));
        });


    },
});

var NBestGateZoomedIn = NBestGate.subClass({
    className: "NBestGateZoomedIn",
    init: function(julia, props) {
        this._super(julia, props);
    },
    updateBBoxForAlternativeView: function(bbox) {
        bbox.cx = julia.mouseX;
        bbox.cy = julia.mouseY;
        bbox.w = 500;
        bbox.h = 500;
        bbox.x = bbox.cx - bbox.w/2;
        bbox.y = bbox.cy - bbox.h/2;
    }
});

var NBestGateZoomedInFuture = NBestGate.subClass({
    className: "NBestGateZoomedInFuture",
    init: function(julia, props) {
        this._super(julia, props);
    },
    updateBBoxForAlternativeView: function(bbox) {
        bbox.cx = julia.mouseX;
        bbox.cy = julia.mouseY;
        bbox.w = 400;
        bbox.h = 400;
        bbox.x = bbox.cx - bbox.w/2;
        bbox.y = bbox.cy - bbox.h/2;
    },
    updateViewCopy: function(viewCopy, bbox2) {
        var mouseMove = {type: "mousemove", element_x: bbox2.cx, element_y: bbox2.cy, source: "mouse"};
        var actionRequests = viewCopy.dispatchEvent(mouseMove);
        actionRequests.forEach(function(actionRequestSequence) {
            actionRequestSequence.requests.forEach(function(request) {
                var vc = request.viewContext;
                request.fn.call(vc, request.event, viewCopy);
            });
        });
    }
});
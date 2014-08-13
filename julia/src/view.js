/**
 * Created by julenka on 7/18/14.
 */

//noinspection JSUnusedGlobalSymbols
/**
 * Represents a component of a user interface (or, potentially, an entire interface).
 * @type {View}
 */
var View = Object.subClass({
    className: "View",
    /**
     * Represents a component of a user interface (or, potentially, an entire interface).
     * @param julia Julia object
     * @param properties list of visual properties object has. These get automatically cloned. Should be a 'shallow' object
     */
    init: function(julia, properties, defaults) {
        this.julia = julia;
        if(typeof(defaults) === 'undefined') {
            defaults = {};
        }
        this.properties = typeof(properties) === 'undefined' ? {} : properties;
        if(typeof(this.__julia_id) === 'undefined') {
            // LAZY HACK TO GET THE FORM DEMO TO WORK
            if('id' in this.properties) {
                this.__julia_id = this.properties.id;
            } else {
                this.__julia_id = guid();
            }

        }

        for (var property in defaults) {
            if(!(property in this.properties)) {
                this.properties[property] = defaults[property];
            }
        }
    },
    /**
     * If this has any action requests that it points to, make sure to move the action requests to
     * the new clone
     * @param clone the clone to copy these action requests to
     */
    cloneActionRequests: function(clone){
        if(typeof this.actionRequests === 'undefined') {
            return;
        }
        var i;
        for(i = 0; i < this.actionRequests.length; i++) {
            this.actionRequests[i].viewContext = clone;
        }
        // after cloning once, we shouldn't update the actionRequests for this view again.
        this.actionRequests = undefined;
    },
    /**
     * Creates an identical copy of this view
     */
    clone: function() {
        // TODO make the clone method more generic: 1. Create a new object 2. copy action requests 3. copy all properties
        var result = new this.constructor(this.julia, this.properties);
        this.cloneActionRequests(result);
        result.properties = shallowCopy(this.properties);
        result.__julia_id = this.__julia_id;
        result._dirty = this._dirty;
        return result;
    },
    /**
     * Return the root view of the interface for this interactor
     * Assumes that 'container' property is set of all elements except root view
     */
    getRootView: function() {
        var root = this.container;
        // Find the root view for this view
        while(root.container) {
            root = root.container;
        }
        return root;
    },
    /**
     * Draws the view
     */
    draw: function() {
        throw "not implemented!";
    },
    /**
     * Return true if this object equals the other object
     */
    equals: function(other) {
        if(this.className !== other.className) {
            return false;
        }
        return shallowEquals(this.properties, other.properties);

    },
    getBoundingBox: function() {
        return {x: this.properties.x, y: this.properties.y, w: this.properties.width || this.properties.w, h: this.properties.height || this.properties.h};
    },
    /**
     * Updates properties of the object (in .properties) using the given map
     * When an object is modified in this way, the dirty bit of the object is also set, meanint
     * this object will be considered 'different' than other objects for feedback purposes
     * @param map A map of the form {attr:newValue}. Use this to update the properties of the object
     * @return the object, in case we want to chain things
     */
    attr: function(map) {
        if(typeof(map) === 'string') {
            // If map is a string, we are trying to get the attribute of this property, not set it
            return this.properties[map];
        }
        for(var prop in map) {
            this.properties[prop] = map[prop];
        }
        this._dirty = true;
        return this;
    },
    /**
     * Dispatches an event to itself and potentially any children.
     * Returns a list action request sequences, where each sequence is a list of action requests.
     * These action requests should be performed one after another, if executed
     * @return
     */
    dispatchEvent: function(e) {
        return [];
    },

    /**
     * Dump a textual representation of the interactor tree to given element
     * @param $el
     */
    domDump: function($el) {
        $el.empty();
        var renderInteractorTreeHelper = function(view, level) {
            var $result = $("<div class='indent-level-" + level + "'></div>");
            $result.append("<p class='obj-property bold'> " + view.className + "</p>");
            if(view instanceof ContainerView) {
                for (var prop in view) {
                    if(typeof view[prop] === "function" || prop === "_super" || prop === "julia" || prop === "className") {
                        continue;
                    }
                    if (prop !== "children") {
                        $result.append("<p class='obj-property'>" + prop + ": " + view[prop] + "</p>");
                    }
                }
                for (var i = 0; i < view.children.length; i++) {
                    var o = view.children[i];
                    $result.append("<p></p>");
                    $result.append(renderInteractorTreeHelper(o, level + 1));
                }
            } else {
                for (var prop in view) {
                    if(typeof view[prop] === "function"  || prop === "_super" || prop === "julia" || prop === "fsm_description" || prop === "className") {
                        continue;
                    }

                    $result.append("<p class='obj-property'>" + prop + ": " + view[prop] + "</p>")
                }
            }
            return $result;
        };
        $el.append(renderInteractorTreeHelper(this, 0));
    },

    /**
     * Dump the state of this interactor to the console
     * @param log_level
     */
    logDump: function(log_level) {
        var dumpHelper = function(view, level) {
            var result = "";
            if(view instanceof ContainerView) {
                for (var prop in view) {
                    if(typeof view[prop] === "function" || prop == "_super" || prop == "julia") {
                        continue;
                    }
                    if (prop !== "children") {
                        result += "\t".repeat(level) + prop + ":" + view[prop] + "\n";
                    }
                }
                result += "\n\n";
                for (var i = 0; i < view.children.length; i++) {
                    var o = view.children[i];
                    result += "\n" + dumpHelper(o, level + 1);
                }
            } else {
                for (var prop2 in view) {
                    if(typeof view[prop2] === "function"  || prop2 === "_super" || prop2 === "julia") {
                        continue;
                    }
                    result += "\t".repeat(level) + prop2 + ":" + view[prop2] + "\n";
                }
            }
            return result;
        };
        log(log_level, dumpHelper(this, 0));
    }
});


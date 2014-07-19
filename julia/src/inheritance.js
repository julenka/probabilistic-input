/**
 * Created by julenka on 7/18/14.
 */

// Inheritance
// Obtained from "Secrets of the JavaScript Ninja", page 145
(function(){
    var initializing = false,
        superPattern =
            /xyz/.test(function() //noinspection BadExpressionStatementJS
            {//noinspection JSHint,JSUnresolvedVariable
                xyz;}) ? /\b_super\b/ : /.*/; // determines in functions can be serialized

    Object.subClass = function(properties) {
        var _super = this.prototype;

        if (properties.className === undefined) {
            throw "in Object.subClass className is undefined!";
        }

        // instantiate the super class
        initializing = true;
        var proto = new this();
        initializing = false;

        for(var name in properties) {
            proto[name] =
                typeof properties[name] === "function" && // make sure the property being overriden is a function
                    typeof _super[name] === "function" && // make sure that the superclass property is also a function
                    superPattern.test(properties[name]) ? // and the function that we are copying calls _super
                    (function(name, fn) {
                        return function() {
                            // save ths pointer to the super class
                            //noinspection JSUnresolvedVariable
                            var tmp = this._super;

                            // set the new super class to be the superclass's super class
                            this._super = _super[name];

                            // call the super class function. Remember that arguments is a special param
                            var ret = fn.apply(this, arguments);

                            this._super = tmp;

                            return ret;
                        };
                    })(name, properties[name]):
                    properties[name];
        }

        function Class() {
            // if we are not initializing, that is, setting up the prototype for extension
            // AND the init method is defined (it should always be defined)
            // call the init method
            if(!initializing && this.init) {
                this.init.apply(this, arguments);
                this.className = properties.className;
                this.toString = function() { return this.className; };
                this.constructor = Class;
            }
        }

        Class.prototype = proto;
        Class.constructor = Class;
        //noinspection JSHint
        Class.subClass = arguments.callee;

        return Class;
    };
})();
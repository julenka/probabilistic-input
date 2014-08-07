/**
 * Created by julenka on 7/18/14.
 */

/** Extensions to existing functions and objects **/

String.prototype.repeat = function(count) {
    var old = this;
    var result = "";
    for(var i = 0; i < count; i++) {
        result += old;
    }
    return result;
};
//
// Math
//

// extracts a random sample from list of weighted samples
// samples are in the form:
// {
//    value_1: weight_1,
//    value_2: weight_2,
// }
// assumes that the weights all sum to 1
Math.weightedRandomSample = function(map) {
    var r = Math.random();
    var sum = 0;
    var last;
    for(var v in map) {
        last = v;
        sum += map[v];
        if (r < sum) {
            return v;
        }
    }
    return last;
};

Math.dieRoll = function(probability) {
    return Math.random() < probability;
};

Math.roundWithSignificance = function(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
};

Math.randint = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

Math.nrand = function() {
    var x1, x2, rad;
    do {
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad >= 1 || rad === 0);
    var c = this.sqrt(-2 * Math.log(rad) / rad);
    return x1 * c;
};

Math.gaussian = function(mu, sigma, x) {
    return this.exp(- this.pow(mu - x, 2) / this.pow(sigma, 2) / 2) / this.sqrt(2 * this.PI * this.pow(sigma, 2));
};

Math.remap = function(v, i_min, i_max, o_min, o_max) {
    if(v < i_min) {
        v = i_min;
    }
    if (v > i_max){
        v = i_max;
    }
    return (v - i_min) / (i_max - i_min) * (o_max - o_min) + o_min;
};

/// Generates a random sample from a gaussian distribution
/// centered around 0 standard deviation sigma.
/// Method take from http://www.bearcave.com/misl/misl_tech/wavelets/hurst/random.html.
/// Has been tested independently so I'm fairly sure it works.
Math.sampleFromGaussian = function(sigma) {
    var x1, x2, w, y1;

    do{
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() -1;
        w = x1 * x1 + x2 * x2;
    } while(w >= 1);

    w = this.sqrt(-2 * this.log(w) / w);
    y1 = x1 * w;
    return y1 * sigma;
};

//
// Array
//

Array.prototype.pop_front = function() {
    var rslt = this.splice(0,1);
    return rslt[0];
};

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

Array.prototype.min = function() {
    return Math.min.apply(null, this);
};

Array.prototype.extend = function(ar2) {
    this.push.apply(this, ar2);
    return this;
};

Array.prototype.mean = function() {
    var sum = this.reduce(function(a, b) { return a + b });
    return sum / this.length;
};

Array.prototype.stdev = function() {
    var mean = this.mean();
    var distances = this.map(function(x) {
        var d = x - mean;
        return d * d;
    });
    var sum = distances.reduce(function(a, b) { return a + b });
    return Math.sqrt(sum / this.length);
};

Array.prototype.shuffle = function() {
    var currentIndex = this.length - 1,
        temp,
        randomIndex;
    while(currentIndex >= 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        temp = this[currentIndex];
        this[currentIndex] = this[randomIndex];
        this[randomIndex] = temp;
        currentIndex--;
    }
};

Function.prototype.curry = function() {
    var fn = this,
        args = Array.prototype.slice.call(arguments);
    return function() {
        //noinspection JSValidateTypes
        return fn.apply(this, args.concat(
            Array.prototype.slice.call(arguments)));
    }; };

/**
 * returns whether this function actually uses the first parameters that are passed to it.
 * A function uses the parameters that are passed to it if the function
 * references the parameter anywhere in the code body
 * If the function contains no params, returns false.
 * for example, this function returns TRUE for the following functions:
 * function(a,b) { return a + b; }
 * function(a) { return a; }
 *
 * And the following function return FALSE:
 * function() { return 0; }
 * function(a,b) { return b; }
 * function(a,b) { return 0; }
 * TODO Make this function work for the first N params
 * TODO Make this function work for all parameters var re2 = /^function\s*\((.*)\)\s*{([\s\S]*)}$/m MATCH
 */
Function.prototype.usesFirstParam = function() {
    // the [\s\S] is because '.' doesn't match whitespace
    // 'm' makes the regex multiline
    // \W matches NON-WORDS
    var regex = /^function\s*\((\w+)[,\)][\s\S]*\W\1\W[\s\S]*}$/m;
    return regex.test(this.toString());
};
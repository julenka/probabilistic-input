// This module depends on jquery, make sure this is loaded first!

function get2DContextForId(id) {
    return document.getElementById(id).getContext('2d');
}

function get2DContextForJQueryCanvas(canvas) {
    return canvas[0].getContext('2d');
}

function round(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
}

// extracts a random sample from list of weighted samples
// samples are in the form:
// { 
//    value_1: weight_1,
//    value_2: weight_2,
// }
// assumes that the weights all sum to 1
function weighted_random_sample(map) {
    var r = Math.random();
    var sum = 0;
    var last = undefined;
    for(var v in map) {
        last = v;
        sum += map[v];
        if (r < sum) {
            return v;
        }
    }
    return last;
}

// Augemnting Math

Math.randint = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
};

Math.nrand = function() {
    var x1, x2, rad, y1;
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

// Augmenting Array

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

function rgb(r,g,b) {
    var result = {
        'r': r,
        'g': g,
        'b': b,
        'a': 1.0
    };
    return result;
}

function rgba(r,g,b,a) {
    var result = {
        'r': r,
        'g': g,
        'b': b,
        'a': a,
    };
    return result;
}

function hsvToRgb(h,s,v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s; 
        v = h.v;
        h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255),
        a: 1.0
    };
}

function remap(v, i_min, i_max, o_min, o_max) {
    if(v < i_min) v = i_min;
    if (v > i_max) v = i_max;
    return (v - i_min) / (i_max - i_min) * (o_max - o_min) + o_min;
}

function getFillStyle(c) {
    return "rgba("+c.r+","+c.g+","+c.b+","+c.a+")";
}

// Logging
function Logger(level) {
	this.level = level;
}

LOG_LEVEL_VERBOSE = 4;
LOG_LEVEL_DEBUG = 3;
LOG_LEVEL_INFO = 2;
LOG_LEVEL_ERROR = 1;

Logger.prototype.log = function(level, msg) {
	if (this.level >= level) {
        console.log(msg);
	}
};

Logger.prototype.clear = function() {
    this.log_element.empty();
};
// Utilities 
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
function rgb(r,g,b) {
    var result = {
        'r': r,
        'g': g,
        'b': b,
        'a': 1.0
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


function get2DContext(id) {
    return document.getElementById('canvas').getContext('2d');
}

function round(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
}

// Logging
function log(msg) {
    $("#log").prepend("<div>"+msg+"</div>");
}

// Settings //////////////////////////////////////
var showMeasurements = true;
var showActual = true;

var visualizationModes = [
    "dots", 
    "resized dots with opacity", 
    "resized dots with color", 
    "dots with contours"];
var currentVisualizationMode = 0;

var filters = [
    "kalman", 
    "ewma",
    "none"];

var currentFilter = 0;

// To determine dt
var time = $.now();

var lastX = 0;
var lastY = 0;

// Draws dot at location
// x: 4 x 1 matrix containint state
// c: particle color
function drawDot(x, c) {
    var pSize = 2;
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), pSize, pSize); // x, y, width, height
}

function updateState() {
    $("#debug").empty();
    $("#debug").append("<div> showMeasurements: " + showMeasurements + "</div>");
    $("#debug").append("<div> visualization mode: " + visualizationModes[currentVisualizationMode] + "</div>");
    $("#debug").append("<div> filter: " + filters[currentFilter] + "</div>");
    for(var i = 0; i < filters.length; i++) {
        $("#debug").append("<div> " + filters[i] + " error: " + round(errors[i].error, 2) + " count: " + errors[i].count);
    }
}

// Draws dot at observed location, change size and alpha to reflect uncertainty
// More uncertain => more transparent
// x: 4x1 matrix containing state
// P: 4 x 4 uncertainty matrix
function drawDot2(x, P, c) {
    var locationUncertainty = P.minor(1,1,2,2);
    var maxUncertainty = locationUncertainty.max();
    var alpha = 1 -  remap(maxUncertainty, 3, 7, 0.0, 0.9);
    var pSize = maxUncertainty;
    c.a = alpha;
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), pSize, pSize); // x, y, width, height 
}


// Draws dot at observed location, change color to reflect uncertainty
// More uncertain => more transparent
// x: 4x1 matrix containing state
// P: 4 x 4 uncertainty matrix
function drawDot3(x, P) {
    var locationUncertainty = P.minor(1,1,2,2);
    var maxUncertainty = locationUncertainty.max();
    var pSize = maxUncertainty;
    var hue = remap(maxUncertainty, 3, 7, 0.66, 0.0);
    var c = hsvToRgb(hue, 1, 1);
    c.a = 0.5;
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), pSize, pSize); // x, y, width, height 
}

// Draws the error ellipse given by uncertainty of state, P
// x: 4 x 1 matrix containing state
// P: 4.4 uncertainty matrix
function drawCov(x, P) {
    var cov = P.minor(1,1,2,2); // covariance matrix for location
    var ctx = get2DContext();
    var maxUncertainty = cov.max();
    var pSize = maxUncertainty;
    var hue = remap(maxUncertainty, 3, 7, 0.66, 0.0);
    var c = hsvToRgb(hue, 1, 1);
    c.a = 0.5;
    
    var a = cov.e(1,1);
    var b = cov.e(2,2);
    
    ctx.save();
    ctx.translate(x.e(1,1), x.e(2,1));

    ctx.beginPath();
    for(var t = 0; t < 2 * Math.PI; t += 0.01) {
        if(t === 0) {
            ctx.moveTo(0,0);
        } else {
            ctx.lineTo(
                a * Math.cos(t),
                b * Math.sin(t));
        }
    }
    ctx.closePath();
    c.a = 0.5;
    ctx.fillStyle  = getFillStyle(c);

    ctx.fill();
    ctx.restore();

}

var errorSmoothing = 0.9;
var errors = [
    {error:0, count: 0},
    {error: 0, count: 0},
    {error: 0, count: 0}]; // errors [i] = errors for that particular filter

function updateError(xActual, yActual) {
    for(var i = 0; i < filters.length; i++) {
        var x = filter_values[i].x;
        var err = Math.sqrt( Math.pow((x.e(1,1) - xActual), 2) + Math.pow((x.e(2,1) - yActual), 2));
        errors[i].count++;
        errors[i].error = errorSmoothing * errors[i].error + (1 - errorSmoothing) * err;    
    }
    
}

function printMatrix(m) {
    var round1000 = function(x){return Math.round(x * 1000)/1000;};
    for (var i = m.rows(); i > 0; i--) {
        log("[" + m.row(i).map(round1000).elements + "]");
    }

}

var kf4d = new KalmanFilter(
    4, 
    $M([[0],[0],[0],[0]]), // x
    Matrix.Random(4, 4),   // P
    $M([ [1, 0, 0, 0],     // H
         [0, 1, 0, 0]]) );
var ewma = new EWMAFilter(2, 0.9, $M([[0],[0]]) );
var nofilter = new NoFilter(2, $M([[0],[0]]) );

var filter_values = [kf4d, ewma, nofilter];

var measurement_noise =  Matrix.Diagonal([20, 20]);

// Kalman Filter constructor
// dimensions: number of dimensions, n
// initial_state: n x 1 matrix
// initial_uncertainty: n x n covariance matrix
// measurement_matrix: measure_n x n matrix
function KalmanFilter(dimensions, initial_state, initial_uncertainty, measurement_matrix) {
    this.n = dimensions;
    this.x = initial_state;
    this.P = initial_uncertainty;
    this.H = measurement_matrix;
    this.I = Matrix.I(this.n);
}

// Increase the state uncertainty by amount
// amount: new_uncertainty = old_uncertainty * (1 + amount)
KalmanFilter.prototype.decay = function(amount) {
    this.P = this.P.map(function (x) {
        return x * (1 + amount);
    });
};

// Execute prediction step of Kalman Filter
// next_state_matrix: n x n, describes predicted next state given current
// external_motion_matrix: n x 1, describes external motion to add
KalmanFilter.prototype.predict = function(next_state_matrix, external_motion_matrix) {
    var F = next_state_matrix;
    var u = external_motion_matrix;
    // this.x = F.x(this.x).add(u);
    this.P = F.x(this.P).x(F.transpose());
};

// Execute measure step of Kalman Filter
// observation: n x 1, observed value
// measurement_uncertainty: measure_n x measure_n, uncertainty of measurement
KalmanFilter.prototype.measure = function(observation, measurement_uncertainty) {
    var R = measurement_uncertainty;
    var Z = observation;
    var y = Z.subtract(this.H.x(this.x));
    var S = this.H.x(this.P).x(this.H.transpose()).add(R);

    var K = this.P.x(this.H.transpose()).x(S.inverse());
    this.x = this.x.add(K.x(y));
    this.P = this.I.subtract(K.x(this.H)).x(this.P);
};

// EWMA filter constructor
// dimensions: number of variables to track
// smoothing_factor: smoothing factor to use for all variables
// initial_state: initial value, matrix dimensions are n_dimensions x 1.
function EWMAFilter(dimensions, smoothing_factor, initial_state) {
    this.n = dimensions;
    this.x = initial_state;
    this.a = smoothing_factor;

}

EWMAFilter.prototype.update = function(observation) {
    var z = observation.minor(1,1,this.n, 1);
    this.x = this.x.multiply(this.a).add(z.multiply(1 - this.a) );
    
}

function NoFilter(dimensions, initial_state) {
    this.n = dimensions;
    this.x = initial_state;
}

NoFilter.prototype.update = function(observation) {
    var z = observation.minor(1,1,this.n, 1);
    this.x = z;
}

var lastV = $V([0,0]);

// Update state estimate based on observation
// Z: observed measurements
function filterKalman(Z) {
    // change in time
    now = $.now();
    dt = now - time;
    time = now;

    // Derive the next state
    var F = $M([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
        ]);
    
    var v = $V([kf4d.x.e(1,1) - Z.e(1,1), kf4d.x.e(2,1) - Z.e(1,2)]).x(1 / dt);
    var acceleration = v.subtract(lastV).distanceFrom(Vector.Zero(2)) / dt;
    lastV = v;
    kf4d.decay(Math.abs(acceleration));

    kf4d.predict(F, $M([[0],[0],[0],[0] ]));

    kf4d.measure(Z, measurement_noise);
}

var ewmaFactor = 0.9;
function filterEWMA(Z) {
    ewma.update(Z.elements);
}

$(window).mousemove(function (e) {
    // Measure
    // Fake uncertaintity in our measurements
    xMeasure = e.pageX + Math.nrand() * measurement_noise.e(1,1);
    yMeasure = e.pageY + Math.nrand() * measurement_noise.e(2,2);

    Z = $M([
        [xMeasure], [yMeasure]
        ]);

    // filter
    filterKalman(Z);
    ewma.update(Z);
    nofilter.update(Z);
    updateError(e.pageX, e.pageY);

    var to_draw = {};
    if(currentFilter === 0) { // kalman
        to_draw = kf4d;
    } else if (currentFilter == 1) { // ewma
        to_draw = {
            x: ewma.x,
            P : Matrix.Diagonal([measurement_noise.e(1,1), measurement_noise.e(2,2), 0, 0])
        };
    } else  if(currentFilter == 2) { // none
        to_draw = {
            x: nofilter.x,
            P: Matrix.Diagonal([measurement_noise.e(1,1), measurement_noise.e(2,2), 0, 0])
        };
    }

    if(currentVisualizationMode === 0) { // dots
        // Draw our predicted point
        drawDot(to_draw.x, rgb(0,0,255));
    } else if (currentVisualizationMode == 1) { // resized dots with opacity
        drawDot2(to_draw.x, to_draw.P, rgb(0,0,255));    
    } else if (currentVisualizationMode == 2) { // resized dots with color
        drawDot3(to_draw.x,to_draw.P);
    } else if (currentVisualizationMode == 3) { // dots with covariance
        drawCov(to_draw.x, to_draw.P);
    }

    if(showMeasurements) {
        // Draw our measured points
        drawDot(Z, rgb(255,0,0) );    
    }
    if(showActual) {
        drawDot($M([[e.pageX], [e.pageY]]), rgb(0,255,0));
    }
    updateState();
});

$(window).keydown(function(e) {
    // log("key pressed: " + e.which);
    var keyCode = e.which;
    if(keyCode == 65) { // 'a'
        showMeasurements = !showMeasurements;
    } else if (keyCode == 83) { // 's'
        currentVisualizationMode++;
        currentVisualizationMode %= visualizationModes.length;
    } else if (keyCode == 68) { // 'd'
        currentFilter++;
        currentFilter %= filters.length;
        if(currentFilter === 0) { // kalman
            P = Matrix.Random(4, 4);
        }
    } else if (keyCode == 70) { // 'f'
        get2DContext().clearRect(0,0, 1000, 1000);
    } else if (keyCode == 74) { // 'j'
        showActual = !showActual;
    }
    updateState();
});

$(window).load(function() {
    updateState();
});


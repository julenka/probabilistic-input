// Utilities 
Math.nrand = function() {
    var x1, x2, rad, y1;
    do {
        x1 = 2 * this.random() - 1;
        x2 = 2 * this.random() - 1;
        rad = x1 * x1 + x2 * x2;
    } while(rad >= 1 || rad == 0);
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
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
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
var showMeasurements = false;

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

// The decay errodes the assumption that velocity 
// never changes.  This is the only unique addition
// I made to the proceedure.  If you set it to zero, 
// the filter will act just like the one we designed
// in class which means it strives to find a consitent
// velocitiy.  Over time this will cause it to assume
// the mouse is moving very slowly with lots of noise.
// Set too high and the predicted fit will mirror the 
// noisy data it recieves.  When at a nice setting, 
// the fit will be resposive and will do a nice job
// of smoothing out the function noise.

var decay = 0.1;

// I use the uncertainty matrix, R to add random noise
// to the known position of the mouse.  The higher the
// values, the more noise, which can be seen by the 
// spread of the orange points on the canvas.
//
// If you adjust this number you will often need to 
// compensate by changing the decay so that the prediction
// function remains smooth and reasonable.  However, as
// these measurements get noisier we are left with a 
// choice between slower tracking (due to uncertainty)
// and unrealistic tracking because the data is too noisy.

var R = Matrix.Diagonal([20, 20]);

// initial state (location and velocity)
// I haven't found much reason to play with these
// in general the model will update pretty quickly 
// to any entry point.

var x = $M([
    [0],
    [0],
    [0],
    [0]
    ]);

// external motion
// I have not played with this at all, just
// added like a udacity zombie.

var u = $M([
    [0],
    [0],
    [0],
    [0]
    ]);

// initial uncertainty 
// I don't see any reason to play with this
// like the entry point it quickly adjusts 
// itself to the behavior of the mouse
var P = Matrix.Random(4, 4);

// measurement function (4D -> 2D)
// This one has to be this way to make things run
var H = $M([
    [1, 0, 0, 0],
    [0, 1, 0, 0]
    ]);

// identity matrix
var I = Matrix.I(4);

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
function drawCov(x, P, c) {
    var cov = P.minor(1,1,2,2); // covariance matrix for location
    var ctx = get2DContext();

    // printMatrix(P);
    // log("p:");
    // printMatrix(cov);
    // log("cov:");
    // right now there are no correleations, so no need to do eigenvector decomposition
    var a = cov.e(1,1);
    var b = cov.e(2,2);
    
    ctx.save();
    ctx.translate(x.e(1,1), x.e(2,1));

    ctx.beginPath();
    for(var t = 0; t < 2 * Math.PI; t += 0.01) {
        if(t == 0) {
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

function updateError(x, xActual, yActual) {
    var err = Math.sqrt( Math.pow((x.e(1,1) - xActual), 2) + Math.pow((x.e(2,1) - yActual), 2));
    errors[currentFilter].count++;
    errors[currentFilter].error = errorSmoothing * errors[currentFilter].error + (1 - errorSmoothing) * err;
}

function printMatrix(m) {

    for (var i = m.rows(); i > 0; i--) {
        log("[" + m.row(i).map(function(x){return Math.round(x * 1000)/1000;}).elements + "]");
    }

}

// Update state estimate based on observation
// Z: observed measurements
function filterKalman(Z) {
    // change in time
    now = $.now();
    dt = now - time;
    time = now;

    // Derive the next state
    F = $M([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
        ]);

    var v = $V([x.e(1,1) - Z.e(1,1), x.e(2,1) - Z.e(1,2)]).distanceFrom(Vector.Zero(2)) / dt;
    //decay confidence
    // to account for change in velocity
    P = P.map(function (x) {
        return x * (1 + decay * v);
    });

    // prediction
    x = F.x(x).add(u);

    P = F.x(P).x(F.transpose());

    // measurement update
    y = Z.transpose().subtract(H.x(x));
    S = H.x(P).x(H.transpose()).add(R);

    K = P.x(H.transpose()).x(S.inverse());
    x = x.add(K.x(y));
    P = I.subtract(K.x(H)).x(P);
}

var ewmaFactor = 0.9;
function filterEWMA(Z) {
    var currentX = x.e(1,1);
    var currentY = x.e(2,1);
    var newX = currentX * ewmaFactor + (1 - ewmaFactor) * Z.e(1,1);
    var newY = currentY * ewmaFactor + (1 - ewmaFactor) * Z.e(1,2);
    x = x.setElements([
        [newX],
        [newY],
        [0],
        [0]
        ]);
}

$(window).mousemove(function (e) {
    // Measure
    // Fake uncertaintity in our measurements
    xMeasure = e.pageX + Math.nrand() * R.e(1,1);
    yMeasure = e.pageY + Math.nrand() * R.e(2,2);

    Z = $M([
        [xMeasure, yMeasure]
        ]);

    // filter
    if(currentFilter == 0) { // kalman
        filterKalman(Z);
    } else if (currentFilter == 1) { // ewma
        filterEWMA(Z);
        P = Matrix.Diagonal([R.e(1,1), R.e(2,2), 0, 0]); 
    } else  if(currentFilter == 2) { // none
        x = x.setElements([
        [xMeasure],
        [yMeasure],
        [0],
        [0]
        ]);
        P = Matrix.Diagonal([R.e(1,1), R.e(2,2), 0, 0]); 
    }
    updateError(x, e.pageX, e.pageY);

    if(currentVisualizationMode == 0) { // dots
        // Draw our predicted point
        drawDot(x, rgb(0,0,255));
    } else if (currentVisualizationMode == 1) { // resized dots with opacity
        drawDot2(x, P, rgb(0,0,255));    
    } else if (currentVisualizationMode == 2) { // resized dots with color
        drawDot3(x,P);
    } else if (currentVisualizationMode == 3) { // dots with covariance
        drawCov(x, P, rgb(100,100,100));
        drawDot(x, rgb(0,0,255));
    }

    if(showMeasurements) {
        // Draw our measured points
        drawDot(Z.transpose(), rgb(255,0,0) );    
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
    } else if (keyCode == 70) { // 'f'
        get2DContext().clearRect(0,0, 1000, 1000);
    }
    updateState();
});

$(window).load(function() {
    updateState();
});


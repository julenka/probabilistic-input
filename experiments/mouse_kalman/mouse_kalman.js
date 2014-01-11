// ***DEPENDENCIES***
// Make sure the following scripts are included before this one!!!
// ../libs/utils.js
// ../libs/filters.js

// Utilities
function get2DContext() {
    return get2DContextForId("canvas");
}

// Settings //////////////////////////////////////
var showActual = false;

var dotScale = 10;

var visualizationModes = [
    "dots", 
    "resized dots with opacity", 
    "resized dots with color", 
    "dots with contours"];
var currentVisualizationMode = 0;
var drawHistory = false;

var filters = [
    "kalman", 
    "ewma",
    "none"];

var currentFilter = 0;
var errorSmoothing = 0.9;
// To determine dt
var time = $.now();



var logger;

// Draws dot at location
// x: 4 x 1 matrix containing state
// c: particle color
function drawDot(x, c) {
    var pSize = 2;
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), pSize * dotScale, pSize * dotScale); // x, y, width, height
}

function updateState() {
    var dbg = $('#debug');
    dbg.empty();
    dbg.append('<div> visualization mode: <em>' + visualizationModes[currentVisualizationMode] + "</em></div>");
    dbg.append("<div> filter: <em>" + filters[currentFilter] + "</em></div>");
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
    c.a = 1 -  remap(maxUncertainty, 2, 4, 0.0, 0.9);
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), maxUncertainty * dotScale, maxUncertainty * dotScale); // x, y, width, height
}


// Draws dot at observed location, change color to reflect uncertainty
// More uncertain => more transparent
// x: 4x1 matrix containing state
// P: 4 x 4 uncertainty matrix
function drawDot3(x, P) {
    var locationUncertainty = P.minor(1,1,2,2);
    var maxUncertainty = locationUncertainty.max();
    var hue = remap(maxUncertainty, 2, 4, 0.66, 0.0);
    var c = hsvToRgb(hue, 1, 1);
    c.a = 0.5;
    var ctx = get2DContext();
    ctx.fillStyle = getFillStyle(c);
    ctx.fillRect(x.e(1, 1), x.e(2, 1), maxUncertainty * dotScale, maxUncertainty  * dotScale); // x, y, width, height
}

// Draws the error ellipse given by uncertainty of state, P
// x: 4 x 1 matrix containing state
// P: 4.4 uncertainty matrix
function drawCov(x, P) {
    var cov = P.minor(1,1,2,2); // covariance matrix for location
    var ctx = get2DContext();
    var maxUncertainty = cov.max();
    var hue = remap(maxUncertainty, 2, 4, 0.66, 0.0);
    var c = hsvToRgb(hue, 1, 1);
    c.a = 0.5;
    
    var a = cov.e(1,1);
    var b = cov.e(2,2);
    
    ctx.save();
    ctx.translate(x.e(1,1), x.e(2,1));
    ctx.scale(dotScale, dotScale);
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

var kf4d = new KalmanFilter(
    4, 
    $M([[0],[0],[0],[0]]), // x
    Matrix.Random(4, 4),   // P
    $M([ [1, 0, 0, 0],     // H
         [0, 1, 0, 0]]) );
var ewma = new EWMAFilter(2, 0.9, $M([[0],[0]]) );
var no_filter = new NoFilter(2, $M([[0],[0]]) );

var filter_values = [kf4d, ewma, no_filter];

var measurement_noise =  Matrix.Diagonal([20, 20]);

var lastV = $V([0,0]);

// Update state estimate based on observation
// Z: observed measurements
function filterKalman(Z) {
    // change in time
    var now = $.now();
    var dt = now - time;
    time = now;
    if(dt === 0)
        return;

    // Derive the next state
    var F = $M([
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
        ]);
    
    var v = $V([kf4d.x.e(1,1) - Z.e(1,1), kf4d.x.e(2,1) - Z.e(2,1)]).x(1 / dt);
    var acceleration = v.subtract(lastV).distanceFrom(Vector.Zero(2)) / dt;
    lastV = v;
    kf4d.decay(Math.abs(0.5 * acceleration));

    kf4d.predict(F, $M([[0],[0],[0],[0] ]));

    kf4d.measure(Z, measurement_noise);
}

function onMouseMove(e) {
    // Measure
    // Fake uncertainty in our measurements
    var xMeasure = e.pageX + Math.nrand() * measurement_noise.e(1,1);
    var yMeasure = e.pageY + Math.nrand() * measurement_noise.e(2,2);

    $("#cursor").offset({top:yMeasure,left:xMeasure});
    var Z = $M([
        [xMeasure], [yMeasure]
    ]);

    // filter
    filterKalman(Z);
    ewma.update(Z);
    no_filter.update(Z);
    updateError(e.pageX, e.pageY);

    var to_draw = {};
    if(currentFilter === 0) { // kalman
        to_draw = kf4d;
    } else if (currentFilter == 1) { // ewma
        to_draw = {
            x: ewma.x,
            P : Matrix.Diagonal([1, 1, 0, 0])
        };
    } else  if(currentFilter == 2) { // none
        to_draw = {
            x: no_filter.x,
            P: Matrix.Diagonal([1, 1, 0, 0])
        };
    }

    if(!drawHistory) {
        get2DContext().clearRect(0,0, 1000, 1000);
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

    if(showActual) {
        drawDot($M([[e.pageX], [e.pageY]]), rgb(0,255,0));
    }
    updateState();
}

function onKeyDown(e) {
    logger.log(LOG_LEVEL_VERBOSE, "key pressed: " + e.which);
    var keyCode = e.which;
    if(keyCode == 65) { // 'a'
        showActual = !showActual;
    } else if (keyCode == 83) { // 's'
        currentVisualizationMode++;
        currentVisualizationMode %= visualizationModes.length;
    } else if (keyCode == 68) { // 'd'
        currentFilter++;
        currentFilter %= filters.length;
    } else if (keyCode == 70) { // 'f'
        get2DContext().clearRect(0,0, 1000, 1000);
    } else if (keyCode == 86) { // 'v'
        drawHistory = !drawHistory;
    } else if (keyCode == 67) { // 'c'
        $('#cursor').toggle();
    }
    updateState();
}

function onLoad() {
    updateState();
    logger = new Logger($('#log'), LOG_LEVEL_DEBUG);
    $('#cursor').hide();
}

$(window).keydown(onKeyDown);
$(window).mousemove(onMouseMove);
$(onLoad);


// ***DEPENDENCIES***
// Make sure the following scripts are included before this one!!!
// ../libs/utils.js

// Settings

var updateParticles = 1;
var updateParticleState = [
    "NO",
    "YES",
];

var noisyMouse = 0;
var noisyMouseState = [
    "NO",
    "YES"
];

var measurementNoise = [25,25];

// TODO: probably doesn't make sense to put these here.
var TARGET_ROWS = 5;
var TARGET_COLS = 5;
var NUM_PARTICLES = 500;

// Global Variables args
var particleFilter;
var logger;
var eventQueue = [];

var letters = 'abcdefghijklmnoprstuvwxyz'.split("");

var textEntered = "";

var canvasWidth = 1000;
var canvasHeight = 1000;

// Updates the text entered
function updateText () {
    var maxval = 0;
    var maxi = -1;
    for(var i = 0; i < particleFilter.reducedParticles.length; i++) {
        if(particleFilter.reducedParticles[i].weight > maxval) {
            maxval = particleFilter.reducedParticles[i].weight;
            maxi = i;
        }
    }
    textEntered += letters[particleFilter.reducedParticles[maxi].particle.target_index];
}


function updateParticleTable() {
    // remove all but first rows in partciles-table
    $("#particles-table tr:gt(0)").remove(); // select all rows of index greater than 1, then remove them.

    var particles = particleFilter.reducedParticles;
    for(var i = 0; i < particles.length; i++) {
        var canvas = $('<canvas id="particle-' + i + '-canvas" />');
        canvas.width(50);
        canvas.height(50);
        // create a canvas and draw it here
        $("#particles-table").find('tbody')
            .append($('<tr>')
                .append($('<td>')
                    .text('' + round(particleFilter.reducedParticles[i].weight, 2))
                )
                .append($('<td>')
                    .append(canvas)
                )
            );
        particles[i].particle.draw(canvas);

    }
}

function updateState() {
    var measureMethod = particleFilter.getMeasureMethod();
    var updateMethod = particleFilter.getUpdateMethod();
    $("#demo-state-measure").html("current measurement method: " + measureMethod.string);
    $("#demo-state-update").html("current update method:" + updateMethod.string);
    $("#demo-state-num-particles").html("number of particles: " + particleFilter.N);
    $("#demo-state-particle-update-state").html("update particles: " + updateParticleState[updateParticles]);
    $("#demo-state-noisy-mouse").html("noisy mouse: " + noisyMouseState[noisyMouse]);
    $("#demo-state-text-entered").html("text entered: " + textEntered);
}


function logMouseEvent(e) {
    var toLog = {
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        type: e.type,
        pageX: e.pageX,
        pageY: e.pageY,
        which: e.which
    };
    logger.log(LOG_LEVEL_VERBOSE, JSON.stringify(toLog));
}

//
// Window Events
//
$(window).keydown(function(e){
    logger.log(LOG_LEVEL_DEBUG, "key pressed: " + e.which);
    var keyCode = e.which;
    if(keyCode == 65) { // 'a'
        particleFilter.incrementMeasureMethod();
    } else if (keyCode == 83) { // 's'
        particleFilter.incrementUpdateMethod();
    } else if (keyCode == 68) { // 'd'
        updateParticles++;
        updateParticles %= 2;
    } else if (keyCode == 70) {// 'f'
        noisyMouse++;
        noisyMouse %= 2;
    } else if (keyCode == 88) { // 'x'
        textEntered = '';
    } else if (keyCode == 90) { // 'z'
        logger.clear();
    }
    updateState();
});


function addNoise(e) {
    if(noisyMouse) {
        var dx = Math.nrand() * measurementNoise[0];
        var dy = Math.nrand() * measurementNoise[1];
        e.pageX += dx;
        e.pageY += dy;
        e.offsetX += dx;
        e.offsetY += dy;
    }
    $("#cursor").css({top:e.offsetY,left:e.offsetX});
}

// On document ready
$(function() {
    logger = new Logger($("#log"), LOG_LEVEL_DEBUG);
    particleFilter = new ParticleFilter(NUM_PARTICLES);
    particleFilter.clear();
    
    updateState();
    
    $("#canvas")[0].width = canvasWidth;
    $("#canvas")[0].height = canvasHeight;

    $("#canvas").mousemove(function(e) {
        addNoise(e);
    });

    $("#canvas").mousedown(function(e) {
        addNoise(e);
        logMouseEvent(e);
        particleFilter.clear();
        eventQueue.push(e);
        particleFilter.step();
        particleFilter.aggregate();
        updateText();
        updateState();
        particleFilter.drawAggregate();
    });

    particleFilter.drawAggregate();
});




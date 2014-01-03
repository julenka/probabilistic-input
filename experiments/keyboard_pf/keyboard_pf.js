// ***DEPENDENCIES***
// Make sure the following scripts are included before this one!!!
// ../libs/utils.js

// Settings
var measurementNoise = [25,25];

// TODO: probably doesn't make sense to put these here.
var NUM_ROWS = 3;
var COLS_PER_ROW = [10, 9, 7];
var ROW_OFFSETS = [0, 0.25, 0.9]; // pixel offsets to render rows at, in terms of item width
var NUM_PARTICLES = 500;

// Global Variables args
var particleFilter;
var logger;
var eventQueue = [];

var letters = 'qwertyuiopasdfghjklzxcvbnm'.split("");

var textEntered = "";
var emptyText = "text goes here";

var canvasWidth = 1000;
var canvasHeight = 500;

var showParticles = false;

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
    $("#demo-state-text-entered").html(textEntered);
    $("#demo-state-text-entered").css({opacity: 1.0});
}


function updateParticleTable() {
    // remove all but first rows in partciles-table
    $("#particles-table tr:gt(0)").remove(); // select all rows of index greater than 1, then remove them.

    var particles = particleFilter.reducedParticles;
    for(var i = 0; i < particles.length; i++) {
        var canvas = $('<canvas id="particle-' + i + '-canvas" />');
        canvas.width(200);
        canvas.height(100);

        canvas[0].width = 500;
        canvas[0].height = 250;
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
    if(textEntered == '') {
        $("#demo-state-text-entered").html(emptyText);
        $("#demo-state-text-entered").css({opacity: 0.5});
    } else {
        $("#demo-state-text-entered").html(textEntered);    
        $("#demo-state-text-entered").css({opacity: 1.0});
    }
    
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
    } else if (keyCode == 70) {// 'f'
        noisyMouse++;
        noisyMouse %= 2;
    } else if (keyCode == 88) { // 'x'
        textEntered = '';
    } else if (keyCode == 90) { // 'z'
        logger.clear();
    } else if (keyCode == 81) { // 'q'
        showParticles = !showParticles;
        if(!showParticles) {
            $('#particles-table').css("display", "None");
        } else {
            $('#particles-table').css("display", "block");
        }
    }
    updateState();

});

// On document ready
$(function() {
    logger = new Logger($("#log"), LOG_LEVEL_DEBUG);
    particleFilter = new ParticleFilter(NUM_PARTICLES);
    particleFilter.clear();
    
    updateState();
    
    $("#canvas")[0].width = canvasWidth;
    $("#canvas")[0].height = canvasHeight;

    $('#particles-table').css("display", "None");

    var mouseDown = -1;
    var particleUpdate = function(e) {
        logMouseEvent(e);
        eventQueue.push(e);
        if(mouseDown == -1 || mouseDown == 1)
            particleFilter.update();
        particleFilter.step();
        particleFilter.aggregate();
        particleFilter.clear();
        particleFilter.drawAggregate();
        if(showParticles) {
            updateParticleTable();
        }
    };
    $("#canvas").mousedown(function(e) {
        particleUpdate(e);
        mouseDown = 1;
    });
    $("#canvas").mousemove(function(e) {
        if(mouseDown == 1) {
            particleUpdate(e);    
        }
    });
    $("#canvas").mouseup(function(e) {
        mouseDown = 0;
        particleFilter.aggregate();
        updateText();
        particleFilter.update();
        logMouseEvent(e);
        particleFilter.aggregate();
        particleFilter.clear();
        particleFilter.drawAggregate();
    });


    particleFilter.drawAggregate();
});




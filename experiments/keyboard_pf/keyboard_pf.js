// ***DEPENDENCIES***
// Make sure the following scripts are included before this one!!!
// ../libs/utils.js
// ../libs/snap.svg.js

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

var showParticles = false;

var mouseDown = -1;

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
    var enteredTextDiv = $("#demo-state-text-entered");
    enteredTextDiv.html(textEntered);
    enteredTextDiv.css({opacity: 1.0});
}

function updateParticleTable() {
    // remove all but first rows in partciles-table
    $("#particles-table tr:gt(0)").remove(); // select all rows of index greater than 1, then remove them.

    var particles = particleFilter.reducedParticles;
    for(var i = 0; i < particles.length; i++) {
        var svg = $('<svg id="particle-' + i + '-svg"  class="particle_snapshot"/>');
        // create a canvas and draw it here
        $("#particles-table").find('tbody')
            .append($('<tr>')
                .append($('<td>')
                    .text('' + round(particleFilter.reducedParticles[i].weight, 2))
                )
                .append($('<td>')
                    .append(svg)
                )
            );
        var s = Snap("#particle-"+i+"-svg");
        particles[i].particle.draw(s, s.node.offsetWidth, s.node.offsetHeight);

    }
}

function updateState() {
    var measureMethod = particleFilter.getMeasureMethod();
    var updateMethod = particleFilter.getUpdateMethod();
    $("#demo-state-measure").html("current measurement method: " + measureMethod.string);
    $("#demo-state-update").html("current update method: " + updateMethod.string);
    $("#demo-state-num-particles").html("number of particles: " + particleFilter.N);
    var enteredTextDiv = $("#demo-state-text-entered");
    if(textEntered == '') {
        enteredTextDiv.html(emptyText);
        enteredTextDiv.css({opacity: 0.5});
    } else {
        enteredTextDiv.html(textEntered);
        enteredTextDiv.css({opacity: 1.0});
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

function onLoad() {
    logger = new Logger(LOG_LEVEL_DEBUG);
    var snap = Snap("#root");
    particleFilter = new ParticleFilter(NUM_PARTICLES, snap);
    particleFilter.clear();

    updateState();

    $('#particles-table').css("display", "None");

    var svg = $("#root");
    svg.mousedown(onMouseDown);
    svg.mousemove(onMouseMove);
    svg.mouseup(onMouseUp);
    particleFilter.drawAggregate();
}

function particleUpdate(e) {
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
}

function onMouseDown(e) {
    particleUpdate(e);
    mouseDown = 1;
}

function onMouseMove(e) {
    if(mouseDown == 1) {
        particleUpdate(e);
    }
}

function onMouseUp(e) {
    mouseDown = 0;
    particleFilter.aggregate();
    updateText();
    particleFilter.update();
    logMouseEvent(e);
    particleFilter.aggregate();
    particleFilter.clear();
    particleFilter.drawAggregate();
}

// On document ready
$(function() {
    onLoad();

});




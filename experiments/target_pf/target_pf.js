// ***DEPENDENCIES***
// Make sure the following scripts are included before this one!!!
// ../libs/utils.js

// Settings
var measureMethods = [
    "1 if in region", 
    "1 / (1 + d_center)", 
    "gaussian",
    "bayesian touch"];
var currentMeasureMethod = 0;

var updateMethods = [
    "none"
    ];
var currentUpdateMethod = 0;

// TODO: probably doesn't make sense to put these here.
var TARGET_ROWS = 5;
var TARGET_COLS = 5;
var NUM_PARTICLES = 10;

// Global Variables argsh
var particleFilter;
var logger;

//
// Particle Filter
//

// ParticleFilter constructor
// N is number of particles
function ParticleFilter(N) {
    this.N= N;
    this.particles = [];
    for(var i = 0; i < N; i++) {
        this.particles.push(new Particle(TARGET_ROWS, TARGET_COLS));
    }
}

ParticleFilter.prototype.step = function(observation) {

};



// Particle prototype. Your custom particle should extend this
// num_targets is the total number of targets in the interface
function Particle(target_rows, target_cols) {
    this.weight = 1.0;
    this.target_rows = target_rows;
    this.target_cols = target_cols;
    this.num_targets = target_rows * target_cols;
    this.target_index = Math.randint(0, this.num_targets);
}

Particle.prototype.measure = function(obj) {
    return 1.0;
};

Particle.prototype.update = function() {
    // returns the same thing, by default
    return this;
};

// canvas: jQuery canvas object
Particle.prototype.draw = function(canvas) {
	var ctx2d = get2DContextForJQueryCanvas(canvas);
};


function updateState() {
    $("#demo-state-measure").html("current measurement method: " + measureMethods[currentMeasureMethod]);
    $("#demo-state-update").html("current update method:" + updateMethods[currentUpdateMethod]);
    $("#demo-state-num-particles").html("number of particles: " + NUM_PARTICLES);
}

function draw() {
    // remove all but first rows in partciles-table
    $("#particles-table tr:gt(0)").remove(); // select all rows of index greater than 1, then remove them.

    for(var i = 0; i < 100; i++) {
        $("#particles-table").find('tbody')
            .append($('<tr>')
                .append($('<td>')
                    .text('' + i)
                )
                .append($('<td>')
                    .text('w' + i)
                )
                .append($('<td>')
                    .text('canvas')
                )
            );

    }
    // for each particle
    // td 1 <=> particle number
    // td 2 <=> particle weight
    // td 3 <=> canvas
    // render particles into this canvas
}

//
// Window Events
//

$(window).keydown(function(e){
    logger.log(LOG_LEVEL_VERBOSE, "key pressed: " + e.which);
    var keyCode = e.which;
    if(keyCode == 65) { // 'a'
        currentMeasureMethod++;
        currentMeasureMethod %= measureMethods.length;
    } else if (keyCode == 83) { // 's'
        currentUpdateMethod++;
        currentUpdateMethod %= updateMethods.length;
    }
    updateState();
});

// On document ready
$(function() {
	var canvas = $("#canvas")[0]; // equivalent to document.getElementById
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = "rgb(200,200,200)";
	ctx.fillRect(0,0,canvas.width, canvas.height);

    logger = new Logger($("#log"), LOG_LEVEL_DEBUG);

    particleFilter = new ParticleFilter(NUM_PARTICLES);
    draw();
    updateState();
});




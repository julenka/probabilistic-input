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
var NUM_PARTICLES = 100;

// Global Variables argsh
var particleFilter;
var logger;
var eventQueue = [];
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
    if(eventQueue.length === 0) {
        return;
    }
    var i;
    var next = eventQueue.pop_front();
    // update
    for(i = 0; i < this.N; i++) {
        this.particles[i] = this.particles[i].update();
    }

    // Apply weighted resampling using 'wheel' method covered in Udacity
    var weights = this.particles.map(function(p) { return p.measure(next); } );
    var weightSum = weights.reduce(function(a,b) { return a + b; });
    var weightsNormed = weights.map(function(w) { return w / weightSum; });
    var weightMax = weightsNormed.max();

    // resample
    var newParticles = [];
    var index = Math.randint(0, this.N - 1);
    var b = 0;
    for (i = 0; i < this.N; i++) {
        b = b + Math.random() * 2 * weightMax;
        while(weightsNormed[index] < b) {
            b = b - weightsNormed[index];
            index = index + 1;
            index = index % this.N;
        }
        newParticles.push(this.particles[index]);
    }
    this.particles = newParticles;
};

ParticleFilter.prototype.draw = function() {
    for(var i = 0; i < this.N; i++) {
        this.particles[i].draw($('#canvas'), 1 / this.N);
    }
}

ParticleFilter.prototype.clear = function() {
    var canvas = $("#canvas")[0]; // equivalent to document.getElementById
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(200,200,200)";
    ctx.fillRect(0,0,canvas.width, canvas.height);
}

// Particle prototype. Your custom particle should extend this
// num_targets is the total number of targets in the interface
function Particle(target_rows, target_cols) {
    this.target_rows = target_rows;
    this.target_cols = target_cols;
    this.num_targets = target_rows * target_cols;
    this.target_index = Math.randint(0, this.num_targets);
}

Particle.prototype.measure = function(e) {
    var cw = $("#canvas").width();
    var ch = $("#canvas").height();
    var itemWidth = Math.floor(cw / this.target_cols);
    var itemHeight = ch / this.target_rows;
    var myR = this.target_index / this.target_cols;
    var myC = this.target_index % this.target_cols;
    var rx = e.offsetX - (myC * itemWidth);
    var ry = e.offsetY - (myR * itemHeight);
    if(rx > 0 && ry > 0 && rx < itemWidth && ry < itemHeight) {
        return 1.0;
    }
    return 0.0;
};

Particle.prototype.update = function() {
    // returns the same thing, by default
    // for now, target index is just 
    this.target_index = Math.randint(0, this.num_targets);
    return this;
};

// canvas: jQuery canvas object
Particle.prototype.draw = function(canvas, alpha) {
    alpha = typeof alpha !== 'undefined' ? alpha : 1.0;

	var ctx2d = get2DContextForJQueryCanvas(canvas);
    
    var cw = canvas[0].width;
    var ch = canvas[0].height;
    var itemWidth = cw / this.target_cols;
    var itemHeight = ch / this.target_rows;
    for(var r = 0; r < this.target_rows; r++) {
        for(var c = 0; c < this.target_cols; c++) {
            var i = r * this.target_cols + c;
            if(i == this.target_index) {
                ctx2d.fillStyle = getFillStyle(rgba(10,10,10,alpha));
            } else {
                ctx2d.fillStyle = getFillStyle(rgba(200,200,200,alpha));
            }
            ctx2d.fillRect(c * itemWidth, r * itemHeight, itemWidth, itemHeight);
        }
    }
};


function updateState() {
    $("#demo-state-measure").html("current measurement method: " + measureMethods[currentMeasureMethod]);
    $("#demo-state-update").html("current update method:" + updateMethods[currentUpdateMethod]);
    $("#demo-state-num-particles").html("number of particles: " + NUM_PARTICLES);
}

function updateParticleTable() {
    // remove all but first rows in partciles-table
    $("#particles-table tr:gt(0)").remove(); // select all rows of index greater than 1, then remove them.

    var particles = particleFilter.particles;
    for(var i = 0; i < particles.length; i++) {
        var canvas = $('<canvas id="particle-' + i + '-canvas" />');
        canvas.width(100);
        canvas.height(100);
        // create a canvas and draw it here
        $("#particles-table").find('tbody')
            .append($('<tr>')
                .append($('<td>')
                    .text('' + i)
                )
                .append($('<td>')
                    .append(canvas)
                )
            );
        particles[i].draw(canvas);

    }
}

function logMouseEvent(e) {
    var toLog = {
        type: e.type,
        pageX: e.pageX,
        pageY: e.pageY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        which: e.which
    };
    logger.log(LOG_LEVEL_VERBOSE, JSON.stringify(toLog));
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

    logger = new Logger($("#log"), LOG_LEVEL_VERBOSE);
    particleFilter = new ParticleFilter(NUM_PARTICLES);
    particleFilter.clear();
    updateParticleTable();
    updateState();

    $("#canvas").mousedown(function(e) {
        logMouseEvent(e);
    });

    $("#canvas").mouseup(function(e) {
        logMouseEvent(e);
        particleFilter.clear();
        eventQueue.push(e);
        particleFilter.step();
        particleFilter.draw();
        updateParticleTable();
    });
});




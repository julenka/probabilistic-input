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

var updateParticles = 1;
var updateParticleState = [
    "NO",
    "YES",
];

var noisyMouse = 1;
var noisyMouseState = [
    "NO",
    "YES"
];

var measurementNoise = [25,25];

// TODO: probably doesn't make sense to put these here.
var TARGET_ROWS = 5;
var TARGET_COLS = 5;
var NUM_PARTICLES = 100;

// Global Variables args
var particleFilter;
var logger;
var eventQueue = [];

var letters = 'abcdefghijklmnoprstuvwxyz'.split("");

var textEntered = "";
//
// Particle Filter
//

// ParticleFilter constructor
// N is number of particles
function ParticleFilter(N) {
    this.N= N;
    this.particles = [];
    this.weights = [];
    this.weightsNorm = [];
    this.reducedParticles = [];
    this.reducedParticleWeights = [];

    for(var i = 0; i < N; i++) {
        this.particles.push(new Particle(TARGET_ROWS, TARGET_COLS));
        this.weights.push(1.0);
        this.weightsNorm.push(1/N);
    }
    this.aggregate();
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
    this.weights = this.particles.map(function(p) { return p.measure(next); } );
    var weightSum = this.weights.reduce(function(a,b) { return a + b; });
    this.weightsNorm = this.weights.map(function(w) { return w / weightSum; });
    var weightMax = this.weightsNorm.max();

    
    // resample
    var newParticles = [];
    var index = Math.randint(0, this.N - 1);
    var b = 0;
    for (i = 0; i < this.N; i++) {
        b = b + Math.random() * 2 * weightMax;
        while(this.weightsNorm[index] < b) {
            b = b - this.weightsNorm[index];
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
};

ParticleFilter.prototype.drawAggregate = function() {
    for(var i = 0; i < this.reducedParticles.length; i++) {
        this.reducedParticles[i].draw($('#canvas'), this.reducedParticleWeights[i]);
    }  
}

ParticleFilter.prototype.clear = function() {
    var canvas = $("#canvas")[0]; // equivalent to document.getElementById
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0,0,canvas.width, canvas.height);
};

ParticleFilter.prototype.aggregate = function() {
    // collect identical particles together, generate normalized weights
    this.reducedParticleWeights = [];
    this.reducedParticles = [];
    var reducedParticleCounts = [];
    for(var i = 0; i < this.N; i++) {
        var p = this.particles[i];
        var found = false;
        for(var j = 0; j < this.reducedParticles.length; j++) {
            if(p.equals(this.reducedParticles[j])) {
                found = true;
                reducedParticleCounts[j]++;
            }
        }
        if(found) continue;
        reducedParticleCounts.push(1);
        // does this push a copy?
        this.reducedParticles.push(p);
        var weightSum = reducedParticleCounts.reduce(function(a,b) { return a + b; });
        this.reducedParticleWeights = reducedParticleCounts.map(function(w) { return w / weightSum; });
    }

ParticleFilter.prototype.updateText = function() {
    // Okay now we're getting super specialized...
    // assumed aggregate has been called
    var maxval = 0
    var maxi = -1;
    for(var i = 0; i < this.reducedParticleWeights.length; i++) {
        if(this.reducedParticleWeights[i] > maxval) {
            maxval = this.reducedParticleWeights[i];
            maxi = i;
        }
    }
    textEntered += letters[this.reducedParticles[maxi].target_index];
}

}

// Particle prototype. Your custom particle should extend this
// num_targets is the total number of targets in the interface
function Particle(target_rows, target_cols) {
    this.target_rows = target_rows;
    this.target_cols = target_cols;
    this.num_targets = target_rows * target_cols;
    this.target_index = Math.randint(0, this.num_targets);
    this.aggregate_id = -1;
}

Particle.prototype.measure = function(e) {
// var measureMethods = [
//     "1 if in region", 
//     "1 / (1 + d_center)", 
//     "gaussian",
//     "bayesian touch"];
// var currentMeasureMethod = 0;
    switch(currentMeasureMethod) {
        case 0: // "1 if in region"
        case 3: // beyesian touch
        return this.inRegionMeasure(e);
        case 1: //"1 / (1 + d_center)"
        return this.distanceMeasure(e);
        case 2: // "gaussian"
        return this.gaussianMeasure(e);
    }
    
};

Particle.prototype.equals = function(other) {
    return other.target_index == this.target_index;
}

Particle.prototype.gaussianMeasure = function(e) {
    //"1 / (1 + d_center)"
    // TODO: refactor
    var cw = $("#canvas").width();
    var ch = $("#canvas").height();
    var itemWidth = Math.floor(cw / this.target_cols);
    var itemHeight = Math.floor(ch / this.target_rows);
    var myR = Math.floor(this.target_index / this.target_cols);
    var myC = this.target_index % this.target_cols;
    var rx = e.offsetX - (myC * itemWidth);
    var ry = e.offsetY - (myR * itemHeight);

    var cx = itemWidth / 2;
    var cy = itemHeight / 2;

    var d = Math.sqrt(Math.pow(cx - rx,2) + Math.pow(cy - ry, 2)); 

    var mu = 0;
    var sigma = 50;
    return Math.gaussian(mu, sigma, d);

};

Particle.prototype.distanceMeasure = function(e) {
    //"1 / (1 + d_center)"
    // TODO: refactor
    var cw = $("#canvas").width();
    var ch = $("#canvas").height();
    var itemWidth = Math.floor(cw / this.target_cols);
    var itemHeight = Math.floor(ch / this.target_rows);
    var myR = Math.floor(this.target_index / this.target_cols);
    var myC = this.target_index % this.target_cols;
    var rx = e.offsetX - (myC * itemWidth);
    var ry = e.offsetY - (myR * itemHeight);

    var cx = itemWidth / 2;
    var cy = itemHeight / 2;

    var d = Math.sqrt(Math.pow(cx - rx,2) + Math.pow(cy - ry, 2));
    return 1 / (1 + d);
};

Particle.prototype.inRegionMeasure = function(e) {
    var cw = $("#canvas").width();
    var ch = $("#canvas").height();
    var itemWidth = Math.floor(cw / this.target_cols);
    var itemHeight = Math.floor(ch / this.target_rows);
    var myR = Math.floor(this.target_index / this.target_cols);
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
    return new Particle(this.target_rows, this.target_cols);
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
                ctx2d.fillStyle = getFillStyle(rgba(200,0,0,alpha));
            } else {
                ctx2d.fillStyle = getFillStyle(rgba(255,255,255,alpha));
            }
            var letter = letters[i];

            ctx2d.fillRect(c * itemWidth, r * itemHeight, itemWidth, itemHeight);
            ctx2d.fillStyle = getFillStyle(rgb(20,20,20));
            ctx2d.font = "14pt Arial";
            ctx2d.fillText(letter, c * itemWidth + itemWidth / 2, r * itemHeight + itemHeight / 2);
        }
    }
};


function updateState() {
    $("#demo-state-measure").html("current measurement method: " + measureMethods[currentMeasureMethod]);
    $("#demo-state-update").html("current update method:" + updateMethods[currentUpdateMethod]);
    $("#demo-state-num-particles").html("number of particles: " + NUM_PARTICLES);
    $("#demo-state-particle-update-state").html("update particles: " + updateParticleState[updateParticles]);
    $("#demo-state-noisy-mouse").html("noisy mouse: " + noisyMouseState[noisyMouse]);
    $("#demo-state-text-entered").html("text entered: " + textEntered);
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
                    .text('' + i)
                )
                .append($('<td>')
                    .text('' + round(particleFilter.reducedParticleWeights[i], 2))
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
    logger.log(LOG_LEVEL_VERBOSE, "key pressed: " + e.which);
    var keyCode = e.which;
    if(keyCode == 65) { // 'a'
        currentMeasureMethod++;
        currentMeasureMethod %= measureMethods.length;
    } else if (keyCode == 83) { // 's'
        currentUpdateMethod++;
        currentUpdateMethod %= updateMethods.length;
    } else if (keyCode == 68) { // 'd'
        updateParticles++;
        updateParticles %= 2;
    } else if (keyCode == 70) {// 'f'
        noisyMouse++;
        noisyMouse %= 2;
    } else if (keyCode == 88) { // 'x'
        textEntered = '';
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
    logger = new Logger($("#log"), LOG_LEVEL_VERBOSE);
    particleFilter = new ParticleFilter(NUM_PARTICLES);
    particleFilter.clear();
    updateParticleTable();
    updateState();
    particleFilter.draw();

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
        particleFilter.updateText();
        updateState();
        particleFilter.drawAggregate();
        if(updateParticles)
            updateParticleTable();
    });
});




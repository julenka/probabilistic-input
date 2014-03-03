// Dependencies: ../utils/language_model.js
//               ../utils/snap.svg.js

function Particle(num_rows, cols_per_row, particle_filter, target_index) {
    this.num_rows = num_rows;
    this.cols_per_row = cols_per_row;
    this.num_targets = cols_per_row.reduce(function(x,y) { return x + y;});
    if(target_index !== undefined) {
        this.target_index = target_index;
    } else {
        this.target_index = Math.randint(0, this.num_targets - 1);
    }
    this.measure_method = 0; // "1 if in region"
    this.particle_filter = particle_filter;
    this.r = this.num_rows;
    var cnt = this.num_targets;
    while (this.target_index < cnt) {
        this.r--;
        cnt -= this.cols_per_row[this.r];
    }
    this.c = this.target_index - cnt;
    // left, top, bottom, right padding as a percentage
    this.paddingPct = .03;
}

Particle.prototype.getDrawInfo = function(width, height) {
    var itemWidth = width / this.cols_per_row[0];
    var x = itemWidth * (ROW_OFFSETS[this.r] + this.c);
    var y = itemWidth * this.r;
    return {
        w: width,
        h: height,
        itemWidth: itemWidth,
        itemHeight: itemWidth,
        x: x,
        y: y,
        xpad: itemWidth * this.paddingPct,
        ypad: itemWidth * this.paddingPct
    };
};

Particle.prototype.getDistanceInfo = function(x, y, width, height) {
    var drawInfo = this.getDrawInfo(width, height);
    var rx = x - (drawInfo.x);
    var ry = y - (drawInfo.y);
    var cx = drawInfo.itemWidth / 2;
    var cy = drawInfo.itemHeight / 2;

    var d = Math.sqrt(Math.pow(cx - rx,2) + Math.pow(cy - ry, 2));
    return {
        dx: cx - rx,
        dy: cy - ry,
        itemWidth: drawInfo.itemWidth,
        itemHeight: drawInfo.itemHeight,
        d: d
    };
}

Particle.prototype.measure = function(e) {
    switch(this.particle_filter.measure_method) {
        case 0: // "1 if in region"
        return this.inRegionMeasure(e);
        case 1: //"1 / (1 + d_center)"
        return this.distanceMeasure(e);
        case 2: // "gaussian"
        return this.gaussianMeasure(e);
    }
    return -1;
};

Particle.prototype.equals = function(other) {
    return other.target_index == this.target_index;
};


Particle.prototype.gaussianMeasure = function(e) {
    var snap = this.particle_filter.snap;
    var distanceInfo = this.getDistanceInfo(e.offsetX, e.offsetY, snap.node.offsetWidth, snap.node.offsetHeight);
    var mu = 0;
    var sigma = 20;
    return Math.gaussian(mu, sigma, distanceInfo.d);

};

Particle.prototype.distanceMeasure = function(e) {
    var snap = this.particle_filter.snap;
    var distanceInfo = this.getDistanceInfo(e.offsetX, e.offsetY, snap.node.offsetWidth, snap.node.offsetHeight);
    return 1 / (1 + distanceInfo.d);
};

Particle.prototype.inRegionMeasure = function(e) {
    var snap = this.particle_filter.snap;
    var distanceInfo = this.getDistanceInfo(e.offsetX, e.offsetY, snap.node.offsetWidth, snap.node.offsetHeight);
    if(distanceInfo.d > 0 &&
        distanceInfo.d < distanceInfo.itemWidth / 2 ) {
        return 1.0;
    }
    return 0.0;
};

/**
 * Particle filter 'update' method using a simple letter frequency model
 * @returns {Particle}
 */
Particle.prototype.updateLetterFreq = function() {
    var random_letter = Math.weighted_random_sample(LETTER_FREQUENCIES);
    // http://stackoverflow.com/questions/94037/convert-character-to-ascii-code-in-javascript
    // 97 is char code of 'a'
    return new Particle(this.num_rows, this.cols_per_row, this.particle_filter, letters.indexOf(random_letter)  );
};

/**
 * Particle filter 'update' method using a one gram model
 * @returns {Particle}
 */
Particle.prototype.updateOneGram = function() {
    if (textEntered.length === 0 ) {
        return this.updateLetterFreq();
    }

    var lastLetter = textEntered[textEntered.length - 1];
    // http://stackoverflow.com/questions/94037/convert-character-to-ascii-code-in-javascript
    // 97 is char code of 'a'
    var random_letter = Math.weighted_random_sample(ONE_GRAM[lastLetter]);
    var target_index = letters.indexOf(random_letter);
    return new Particle(this.num_rows, this.cols_per_row, this.particle_filter, target_index);
};


/**
 * Particle filter 'update' method using random particle drawn from uniform distribution
 * @returns {Particle}
 */
Particle.prototype.updateRandom = function() {
    return new Particle(this.num_rows, this.cols_per_row, this.particle_filter);
};

// Draw the interface this particle represents to the canvas.
// canvas: jQuery canvas object
// alpha: opacity to use. [0-255]
Particle.prototype.draw = function(snap, width, height) {
    var i = 0;
    var drawInfo = this.getDrawInfo(width, height);
    for(var r = 0; r < this.num_rows; r++) {
        for(var c = 0; c < this.cols_per_row[r]; c++) {
            var fill = getFillStyle(rgb(200,0,0));
            if(i != this.target_index) {
                fill = getFillStyle(rgb(255,255,255));
            }
            var letter = letters[i]; // letters is defined in target_pf.js

            var x = ROW_OFFSETS[r] * drawInfo.itemWidth + c * drawInfo.itemWidth + drawInfo.xpad;
            var y = r * drawInfo.itemHeight + drawInfo.ypad;
            snap.rect().attr({
                fill: fill,
                x: x,
                y: y,
                stroke: "#000000",
                strokeWidth: 1,
                width: drawInfo.itemWidth - 2 * drawInfo.xpad,
                height: drawInfo.itemHeight - 2 * drawInfo.ypad,
                rx: drawInfo.itemWidth / 4,
                ry:drawInfo.itemWidth / 4
            });
            snap.text(x + drawInfo.itemWidth / 2, y + drawInfo.itemHeight / 2 + drawInfo.itemHeight / 8, letter).attr(
                {
                   "font-size": drawInfo.itemHeight / 2,
                   fill: "#000000",
                    "text-anchor": "middle"
                });
            i++;
        }
    }
};


// ParticleFilter constructor
// N is number of particles
function ParticleFilter(N, snap) {
    this.N= N;
    this.snap = snap;

    this.measure_method = 2; 
    this.update_method = 2;

    this.reset();
}

ParticleFilter.prototype.reset = function () {
    this.particles = [];
    this.weights = [];
    this.weightsNorm = [];
    this.reducedParticles = []; // [ {weight: x, particle: y}]
    for (var i = 0; i < this.N; i++) {
        this.particles.push(new Particle(NUM_ROWS, COLS_PER_ROW, this));
        this.weights.push(1.0);
        this.weightsNorm.push(1 / this.N);
    }
    this.aggregate();
};


ParticleFilter.prototype.measureMethods = [
    "1 if in region", 
    "1 / (1 + d_center)", 
    "gaussian"
];

// Sets measurement method to use for particle filter
// val (int): value to set measure method to
ParticleFilter.prototype.incrementMeasureMethod = function() {
    this.measure_method++;
    this.measure_method %= this.measureMethods.length;
};

// Returns the measurement method used
ParticleFilter.prototype.getMeasureMethod = function() {
    return {
        value: this.measure_method,
        string: this.measureMethods[this.measure_method]
    };
};

/**
 *
 * @param update_prob Probability that update will randomly execute instead of doing specified update method
 */
ParticleFilter.prototype.update = function(update_prob) {
    for(var i = 0; i < this.N; i++) {
        if(this.update_method === 0 || Math.random() < update_prob) { // none
            this.particles[i] = this.particles[i].updateRandom();
        } else if (this.update_method == 1) { // letter frequency
            this.particles[i] = this.particles[i].updateLetterFreq();
        } else if (this.update_method == 2) { // n grams
            this.particles[i] = this.particles[i].updateOneGram();
        } else {
            logger.log(LOG_LEVEL_DEBUG, "ERROR: invalid update_method in particle filter: " + this.update_method);
        }
    }
};

ParticleFilter.prototype.updateMethods = [
    "uniform",
    "letter frequency",
    "one grams"
];

ParticleFilter.prototype.incrementUpdateMethod = function() {
    this.update_method++;
    this.update_method %= this.updateMethods.length;
};

ParticleFilter.prototype.getUpdateMethod = function() {
    return {
        value: this.update_method,
        string: this.updateMethods[this.update_method]
    };
};

ParticleFilter.prototype.step = function() {
    if(eventQueue.length === 0) {
        return;
    }
    var i;
    var next = eventQueue.pop_front();

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

ParticleFilter.prototype.drawAggregate = function() {
    this.clear();
    for(var i = 0; i < this.reducedParticles.length; i++) {
        var g = this.snap.group().attr(
            {
                opacity: this.reducedParticles[i].weight
            }
        );
        this.reducedParticles[i].particle.draw(g, this.snap.node.offsetWidth, this.snap.node.offsetHeight);
    }  
};

ParticleFilter.prototype.clear = function() {
    this.snap.clear();
};

ParticleFilter.prototype.aggregate = function() {
    // collect identical particles together, generate normalized weights
    this.reducedParticles = [];
    var reducedParticleCounts = [];
    var i;
    for(i = 0; i < this.N; i++) {
        var p = this.particles[i];
        var found = false;
        for(var j = 0; j < this.reducedParticles.length; j++) {
            if(p.equals(this.reducedParticles[j].particle)) {
                found = true;
                reducedParticleCounts[j]++;
            }
        }
        if(found) continue;
        reducedParticleCounts.push(1);
        // does this push a copy?
        this.reducedParticles.push({weight: 0, particle: p});
    }
    var weightSum = reducedParticleCounts.reduce(function(a,b) { return a + b; });
    for (i = 0; i < this.reducedParticles.length; i++) {
        this.reducedParticles[i].weight = reducedParticleCounts[i] / weightSum;
    }
    this.reducedParticles =this.reducedParticles.sort(function(a,b) { return b.weight - a.weight;});
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
function getFillStyle(c) {
    return "rgba("+c.r+","+c.g+","+c.b+","+c.a+")";
}

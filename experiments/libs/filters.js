// Implements several common filters
// Kalman Filter
// EWMA
// Default filter (no filter)

//
// Particle Filter
//


// FILL IN!!!



//
// Kalman Filter
//

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

//
// EWMA
//

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
};

//
// No Filtering
//


function NoFilter(dimensions, initial_state) {
    this.n = dimensions;
    this.x = initial_state;
}

NoFilter.prototype.update = function(observation) {
    var z = observation.minor(1,1,this.n, 1);
    this.x = z;
};
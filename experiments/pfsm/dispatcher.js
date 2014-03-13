/**
 * Created by julenka on 3/6/14.
 */

// TODO: need some sort of module system!

/**
 *
 * @param dispatchCompleted function to execute once dispatch is done,
 **/
function Dispatcher(sketch, dispatchCompleted) {
    this.sketches = [sketch];
    this.dispatchCompleted = dispatchCompleted;
    this.nSamplesPerEvent = 100;
    this.nSketchSamples = 10;
}
Dispatcher.prototype.dispatchEvent = function(e) {
    var samples = e.getSamples(this.nSamplesPerEvent);
    var new_sketches = [];
    // declare outside of loop to remind me of scope
    var sketch, sample, responses, i, j, k, total_responses = 0;
    var start_sketch_size = this.sketches.length, post_dispatch_size,post_resample_size;
    var aggregate_responses = [], response_match_found;
    // for each sample, dispatch to each sketch
    for(i = 0; i < this.sketches.length; i++) {
        sketch = this.sketches[i];
        for(j = 0; j < samples.length; j++) {
            sample = samples[j];
            // response:
            // [ {new_sketch: XXX, action_request: XXX, feedback_request: XXX} ]
            responses = sketch.dispatchEvent(sample);

            responses.forEach(function(response){
                total_responses++;
                response_match_found = false;
                for(k = 0; k < aggregate_responses.length; k++) {
                    if(aggregate_responses[k].transition_id == response.transition_id && aggregate_responses[k].new_sketch.equals(response.new_sketch)) {
                        response_match_found = true;
                        aggregate_responses[k].count++;
                    }
                }
                if(!response_match_found) {
                    response.count = 1;
                    aggregate_responses.push(response);
                }
                // TODO: execute feedback action, if defined
                // TODO: execute final action, if defined

            });
        }
    }

    aggregate_responses.forEach(function(response) {
        new_sketches.push({sketch: response.new_sketch, probability: response.count / total_responses});
    });

    // TODO: weigthed resampling
    post_dispatch_size = new_sketches.length;

    // TODO: log size before/after dispatching and downsampling
    // downsample
    this.sketches = [];
    var callback_sketches = []
    new_sketches.shuffle();
    var i, n = Math.min(new_sketches.length, this.nSketchSamples);
    // TODO: weigthed resampling
    for(i = 0; i < n; i++) {
        this.sketches.push(new_sketches[i].sketch);
        callback_sketches.push(new_sketches[i]);
    }
    post_resample_size = this.sketches.length;
    // call dispatch completed
    this.dispatchCompleted(callback_sketches, start_sketch_size, post_dispatch_size, post_resample_size);
};
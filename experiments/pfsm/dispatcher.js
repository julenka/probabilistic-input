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
    var sketch, sample, responses, i, j, k, nothing_happened;
    // for each sample, dispatch to each sketch
    for(i = 0; i < this.sketches.length; i++) {
        nothing_happened = true;
        sketch = this.sketches[i];
        for(j = 0; j < samples.length; j++) {
            sample = samples[j];
            // response:
            // [ {new_sketch: XXX, new_control: XXX, action_request: XXX, feedback_request: XXX} ]
            responses = sketch.dispatchEvent(sample);
            if(nothing_happened && responses.length > 0) {
                nothing_happened = false;
            }
            responses.forEach(function(response){
                // TODO: execute update action
                if(typeof response.update !== 'undefined' && typeof response.new_control != 'undefined') {
                    response.update.call(response.new_control, e);
                }
                // TODO: execute feedback action
                // TODO: execute final action
                new_sketches.push(response.new_sketch);
            });
        }
        if(nothing_happened) {
            new_sketches.push(sketch);
        }
    }

    // downsample
    this.sketches = [];
    new_sketches.shuffle();
    var i, n = Math.min(new_sketches.length, this.nSketchSamples);
    for(i = 0; i < n; i++) {
        new_sketches[i].probability = 1/n;
        this.sketches.push(new_sketches[i]);
    }

    // call dispatch completed
    this.dispatchCompleted(this.sketches);
};
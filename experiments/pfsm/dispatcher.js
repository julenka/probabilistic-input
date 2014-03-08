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
    var sample, response, i;
    // for each sample, dispatch to each sketch
    for(i = 0; i < samples.length; i++) {
        sample = samples[i];
        for(var j = 0; j < this.sketches.length; j++) {
            response = this.sketches[j].dispatchEvent(sample);
            new_sketches.extend(response.new_sketches);
            // TODO: implement consumption probability
        }
    }

    // downsample
    this.sketches = [];
    new_sketches.shuffle();
    var i;
    for(i = 0; i < Math.min(new_sketches.length, this.nSketchSamples); i++) {
        this.sketches.push(new_sketches[i]);
    }
    // call dispatch completed
    this.dispatchCompleted(this.sketches);
};
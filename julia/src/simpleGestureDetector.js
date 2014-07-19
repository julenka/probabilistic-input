/**
 * Created by julenka on 7/18/14.
 */


/**
 * Detects simple gestures: horizontal and vertical motion using super naive algorithm
 * @constructor
 */
function SimpleGestureDetector() {

}
SimpleGestureDetector.prototype.GESTURE_HORIZONTAL = 0;
SimpleGestureDetector.prototype.GESTURE_VERTICAL = 1;
SimpleGestureDetector.prototype.GESTURE_NONE = 2;
SimpleGestureDetector.prototype.start = function(e) {
    this.down_x = e.base_event.element_x;
    this.down_y = e.base_event.element_y;
    this.total_x_motion = 0;
    this.total_y_motion = 0;
};

SimpleGestureDetector.prototype.update = function(e) {
    var dx = Math.abs(e.base_event.element_x - this.down_x);
    var dy = Math.abs(e.base_event.element_y - this.down_y);
    this.total_x_motion += dx;
    this.total_y_motion += dy;
};

SimpleGestureDetector.prototype.detect = function() {
    if(this.total_x_motion * 0.75  > this.total_y_motion) {
        return SimpleGestureDetector.prototype.GESTURE_HORIZONTAL;
    }
    if(this.total_y_motion  *0.75 > this.total_x_motion) {
        return SimpleGestureDetector.prototype.GESTURE_VERTICAL;
    }
    return SimpleGestureDetector.prototype.GESTURE_NONE;
};

SimpleGestureDetector.prototype.clone = function() {
    return deepCopy(this);
};
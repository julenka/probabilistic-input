/**
 * Created by julenka on 8/27/14.
 */

var SnappingPathBrush = PathBrush.subClass({
    className: "SnappingPathBrush",
    dispatchEvent: function(e) {
        var snap_radius = 40;
        this.properties.snapped = false;
        var result = this._super(e);
        if(this.current_state === "start" || this.snapped) {
            return result;
        }
        var pt = this.getEndPoint();
        var children = this.getRootView().children;

        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            if(child.__julia_id === this.__julia_id) {
                continue;
            }

            if(child.snapPointsNear) {
                var nearby = child.snapPointsNear(pt, snap_radius);
                for(var j = 0; j < nearby.length; j++) {
                    var snapPoint = shallowCopy(nearby[j]);
                    // weight the likelihood of the request based on the distance to the snap point.
                    var weight = (snap_radius - snapPoint.d) / snap_radius;
                    result.push(
                        new SnapPointActionRequest(
                            this.snapToPoint.curry(snapPoint),
                            this,
                            true,
                            true,
                            shallowCopy(e),
                            weight
                        )
                    );
                }
            }
        }
        return result;
    },
    draw: function ($el) {
        this._super($el);
        var snap = Snap($el[0]);
        if(this.properties.snapped) {
            var endPoint = this.getEndPoint();
           snap.circle(endPoint.x, endPoint.y, 20).attr({
               "stroke-width": 5,
               fill: "white",
               stroke: "red",
               opacity: 0.5
           });
        }
    },
    /**
     * Returns the last point of the path
     */
    getEndPoint: function() {
        return this.path[this.path.length - 1];
    },
    setEndPoint: function(x, y) {
        if(this.path.length < 1) {
            return;
        }
        this.path[this.path.length - 1] = {x: x, y: y};
    },
    snapToPoint: function(pt) {
        this._dirty = true;
        this.setEndPoint(pt.x, pt.y);
        this.properties.snapped = true;
    },
    equals: function(other) {
        if(!this._super(other)) {
            return false;
        }
        if(!(other instanceof SnappingPathBrush)) {
            return false;
        }
        if(this.path.length === 0){
            return other.path.length === 0;
        }
        return shallowEquals(this.getEndPoint(), other.getEndPoint());
    }
});
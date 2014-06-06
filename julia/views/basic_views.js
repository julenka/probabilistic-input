/**
 * Created by julenka on 6/5/14.
 */
var TextView = View.subClass({
    className: "TextView",
    init: function(julia, props) {
        this._super(julia, props, {text: "", x: 0, y: 0});
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.text(this.properties.x, this.properties.y, this.properties.text).attr({"font-family": "monospace"});
    },
    dispatchEvent: function() {
        return [];
    },
});

var Path = View.subClass({
    className: "Path",
    /**
     * A simple path
     * properties:
     * path: ["x,y", "x,y", ... ]
     * color
     * radius
     * opacity
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props, {path: [], color: "red", radius: 5, opacity: 1});
    },
    draw: function ($el) {
        // TODO are we okay with drawing this to a Snap?
        // in this case $el will be an SVG element
        var s = Snap($el[0]);
        if (this.properties.path.length > 1) {
            s.path("M" + this.properties.path.join("L")).attr({stroke: this.properties.color, fill: "none",
                "stroke-width": this.properties.radius, opacity: this.properties.opacity});
        }
    }
});

var Circle = View.subClass({
    className: "Circle",
    /**
     * A basic circle
     * properties:
     * cx
     * cy
     * radius
     * strokeColor
     * strokeWidth
     * fillColor
     * fillOpacity
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props, {cx: 0, cy: 0, radius: 10, strokeColor: "black",
            strokeWidth: 5, fillColor: "black", fillOpacity: 0});
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.circle(this.properties.cx, this.properties.cy, this.properties.radius).attr({
            stroke: this.properties.strokeColor,
            fill: this.properties.fillColor,
            "stroke-width": this.properties.strokeWidth,
            "fill-opacity": this.properties.fillOpacity
        });
    }
});

var Polyline = View.subClass({
    className: "Polyline",
    /**
     * A basic triangle
     * properties:
     * points
     * strokeColor
     * strokeWidth
     * fillColor
     * fillOpacity
     * @param julia
     * @param props
     */
    init: function(julia, props, points) {
        this._super(julia, props, {strokeColor: "black",
            strokeWidth: 5, fillColor: "black", fillOpacity: 0});
        this.points = points;

    },
    draw: function($el) {
        var s = Snap($el[0]);
        var pts = [];
        this.points.forEach(function(pt) {
            pts.push(pt.x);
            pts.push(pt.y);
        });
        s.polygon(pts).attr({
            stroke: this.properties.strokeColor,
            fill: this.properties.fillColor,
            "stroke-width": this.properties.strokeWidth,
            "fill-opacity": this.properties.fillOpacity
        });
    },
    clone: function(){
        var result = this._super();
        result.points = deepCopy(this.points);
        return result;
    },
    equals: function(other) {
        if(!this._super(other)) { return false;}
        if (other.points.length != this.points.length) { return false; }
        for(var i = 0; i < this.points.length; i++) {
            if(!shallowEquals(this.points[i], other.points[i])) {
                return false;
            }
        }
        return true;
    }
});



var Rect = View.subClass({
    className: "Rect",
    /**
     * A basic circle
     * properties:
     * cx
     * cy
     * radius
     * strokeColor
     * strokeWidth
     * fillColor
     * fillOpacity
     * @param julia
     * @param props
     */
    init: function(julia, props) {
        this._super(julia, props, {x: 0, y: 0, w: 10, h: 10, strokeColor: "black",
            strokeWidth: 5, fillColor: "black", fillOpacity: 0});
    },
    draw: function($el) {
        var s = Snap($el[0]);
        s.rect(this.properties.x, this.properties.y, this.properties.w, this.properties.h).attr({
            stroke: this.properties.strokeColor,
            fill: this.properties.fillColor,
            "stroke-width": this.properties.strokeWidth,
            "fill-opacity": this.properties.fillOpacity
        });
    }
});
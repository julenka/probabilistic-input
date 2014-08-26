/**
 * Created by julenka on 8/26/14.
 */

var PNinjaCursorEvent = PEvent.subClass({
    className: "PNinjaCursorEvent",
    init: function(identity_p, e, type, uiWidth, uiHeight, currentTarget) {
        this._super(identity_p, e);
        this.type = type;
        this.source = "mouse";

        var left = 0, top = 0;
        //noinspection JSUnresolvedVariable
        if (currentTarget !== window) {
            //noinspection JSHint
            var offset = $(currentTarget).offset();
            left = offset.left;
            top = offset.top;
        }
        if(isNaN(left)) {
            left = 0 ;
        }
        if(isNaN(top)) {
            top = 0;
        }
        this.element_x = e.pageX - left;
        this.element_y = e.pageY - top;
        this.uiWidth = uiWidth;
        this.uiHeight = uiHeight;
    },
    getSamples: function(n){
        var result = [];
        var nRows = Math.min(n, 5);
        var nCols = n / nRows;

        var cellWidth = this.uiWidth / nCols;
        var cellHeight = this.uiHeight / nRows;

        for(var row = 0; row < nRows; row++) {
            for(var col =  0; col < nCols; col++) {
                var x1 = this.element_x % cellWidth;
                var y1 = this.element_y % cellHeight;

                var x2 = col * cellWidth + x1;
                var y2 = row * cellHeight + y1;

                for(var i = 0; i < 5; i++) {
                    result.push(new PMouseEventSample(1/n, this,
                        0,0, x2, y2
                    ));
                }

            }
        }

        return result;
    }

});
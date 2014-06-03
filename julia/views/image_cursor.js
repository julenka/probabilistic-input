/**
 * Created by julenka on 5/21/14.
 */

// Requires julia.js
var ImageCursor = Cursor.subClass({
    className: "ImageCursor",
    /**
     * Cursor that displays an image
     * @param julia
     */
    init: function(julia) {
        this._super(julia);
    },
    set_image_src: function(src) {
        this.properties.img_src = src;
        var me = this;
        $('<img src="'+ this.properties.img_src +'">').load(function() {
            me.src = src;
            var el = $(this)[0];
            me.properties.w = el.naturalWidth;
            me.properties.h = el.naturalHeight;
        });
    },
    draw: function ($el) {
        var s = Snap($el[0]);
        s.image(this.properties.img_src,
            this.properties.x - this.properties.w / 2,
            this.properties.y - this.properties.h / 2,
            this.properties.w, this.properties.h);
    },
    setImage: function(src) {
        this.img_src = src;
    }
});

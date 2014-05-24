/**
 * Created by julenka on 5/21/14.
 */

// Requires julia.js
var ImageCursor = Cursor.subClass({
    className: "ImageCursor",
    init: function(julia) {
        this._super(julia);
    },
    clone: function() {
        var result = new ImageCursor(this.julia);
        this.copyFsm(result);
        this.cloneActionRequests(result);
        this.copyProperties(result);
        return result;
    },
    copyProperties: function(clone) {
        this._super(clone);
        clone.img_src = this.img_src;
        clone.w = this.w;
        clone.h = this.h;
    },
    set_image_src: function(src) {
        this.img_src = src;
        var me = this;
        $('<img src="'+ this.img_src +'">').load(function() {
            me.src = src;
            var el = $(this)[0];
            me.w = el.naturalWidth;
            me.h = el.naturalHeight;
            log(LOG_LEVEL_DEBUG, "src: " + me.src + " w: " + me.w);
        });
    },
    drag_progress: function(e) {
    },
    drag_end: function(e) {
    },
    draw: function ($el) {
        var s = Snap($el[0]);
        s.image(this.img_src, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    },
    setImage: function(src) {
        this.img_src = src;
    }
});

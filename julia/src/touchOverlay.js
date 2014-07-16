/**
 * Created by julenka on 7/16/14.
 */

/***** START TOUCH OVERLAY *****/

function addTouchOverlay() {
    // We want to be able to hide the cursor when we're adding a touch overlay
    $(document).keypress(function(e){
        if(e.keyCode === 32) { // 32 is spacebar
            var demo_interface = document.getElementById("demo_interface");
            var touch_overlay = document.getElementById("touch-overlay");
            if(demo_interface && $(demo_interface).css('cursor') === 'default') {
                $(demo_interface).css({'cursor': 'none'});
                $(touch_overlay).css({'cursor': 'none'});
            } else if (demo_interface) {
                $(demo_interface).css({'cursor': 'default'});
                $(touch_overlay).css({'cursor': 'default'});
            }
            e.preventDefault();
        }
    });

    var snap = Snap();
    snap.attr({'id': 'touch-overlay'});
    var upR = 15;
    var downR = 10;
    var cursor = snap.circle(0,0, upR).attr({fill: '#cccccc', opacity: 0.1});
    $(document).mousemove(function(e){
        cursor.attr({cx: e.clientX, cy: e.clientY});
        return false;
    });
    $(document).mousedown(function(e){
        cursor.animate({opacity: 0.8, r: downR}, 100);
        return false;
    });
    $(document).mouseup(function(e){
        cursor.animate({opacity: 0.1, r: upR}, 100);
        return false;
    });

}

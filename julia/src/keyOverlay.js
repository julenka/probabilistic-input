
/**
 * Fades in an animation indicating that a key has been pressed
 */
function addKeyOverlay() {
    var snap = Snap();
    snap.attr({'id': 'key-overlay'});
    var window_width = $("#key-overlay").width();
    var window_height = $("#key-overlay").height();
    var key_width = 100;
    var key_height = 100;
    var g = snap.g();
    var corner_radius = 5;
    g.rect(0,0,key_width, key_height).attr({fill: "#333",  rx: corner_radius, ry: corner_radius, "stroke-width": 10});
    g.rect(corner_radius,corner_radius,key_width - 2 * corner_radius, key_height - 2 * corner_radius).attr({fill: "#ccc", rx: corner_radius - 1, ry: corner_radius - 1, "stroke-width": 10});
    var t = g.text(key_width / 2, key_height / 2 + 10, "0").attr({"font-size": 36, "text-anchor": "middle"});
    var m_start = new Snap.Matrix();
    m_start.translate(window_width /2 - key_width / 2, window_height / 2 - key_height / 2);
    m_start.scale(1);
    //

    var m_end = new Snap.Matrix();
    m_end.translate(window_width /2, window_height / 2 );
    m_end.scale(2);
    m_end.translate(- key_width / 2, - key_height / 2);
    g.attr({opacity: 0});
    $(document).keypress(function(e) {1
        var key = e.keyCode || e.charCode;
        if(key >= 48 && key <= 57) {
            t.attr({text: (key-48).toString()});
            g.attr({opacity: 1, transform: m_start});
            g.animate({opacity: 0.0, transform: m_end}, 800, mina.easein);
        }

    });
}

/**
 * When a key is pressed, fake a touch animation by pretending to click an item in the upper left hand corner
 * $el - parent element, upper left of el will be 0,0
 */
function addKeyFakeTouchOverlay($el) {
    var cursorSize = 10;
    var snap = Snap();
    var box_size = 87;
    var yOffset = 30;
    var xOffset = 9;
    snap.attr({'id': 'key-overlay'});

    // we need to add these fake touches to be relative to the $el
    // put the cursor in a container whose position is the top, left of $el
    var container = snap.group();
    var container_tform = new Snap.Matrix();
    var offset = $el.offset();
    container_tform.translate(offset.left, offset.top);
    container.attr({transform: container_tform});

    var cursor = container.circle(0,0, cursorSize).attr({fill: '#444', opacity: 0.1});
    cursor.attr({opacity: 0});

    // Uncomment to debug layout of dots
//    for(var i = 0; i < 3; i++) {
//        var x = xOffset + i * box_size;
//        var y = yOffset;
//        container.rect(x, y, box_size, box_size).attr({stroke: "red", "stroke-width": 2, "fill-opacity": 0});
//        container.circle(x + box_size / 2, y + box_size / 2, cursorSize).attr({fill:"red"});
//
//    }
    $(document).keypress(function(e) {
        var key = e.keyCode || e.charCode;
        if(key >= 48 && key <= 57) {
            // subtract one from index because we start at key 1
            var index = key - 48 - 1;

            var m_start = new Snap.Matrix();
            m_start.translate(xOffset + box_size * (index + 0.5), box_size / 2 + yOffset);
            m_start.scale(1);

            var m_end = new Snap.Matrix();
            m_end.translate(xOffset + box_size * (index + 0.5), box_size / 2 + yOffset);
            m_end.scale(2);

            cursor.attr({opacity: 0.8, transform: m_start});
            cursor.animate({opacity: 0.0, transform: m_end}, 200, mina.easein);
        }

    });
}
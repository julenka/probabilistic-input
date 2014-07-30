
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
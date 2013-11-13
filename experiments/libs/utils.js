// This module depends on jquery, make sure this is loaded first!

function get2DContextForId(id) {
    return document.getElementById(id).getContext('2d');
}

function round(n, sig) {
    return Math.round(n * Math.pow(10, sig)) / Math.pow(10,sig);
}


// Logging
function Logger(log_jquery_element, level) {
	this.log_element = log_jquery_element;
	this.level = level;
}

LOG_LEVEL_VERBOSE = 4;
LOG_LEVEL_DEBUG = 3;
LOG_LEVEL_INFO = 2;
LOG_LEVEL_ERROR = 1;

Logger.prototype.log = function(level, msg) {
	if (this.level >= level) {
		this.log_element.prepend("<div>"+msg+"</div>");
	}
}
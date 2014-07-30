/**
 * Created by julenka on 7/18/14.
 */

//noinspection JSUnusedGlobalSymbols,JSUnusedGlobalSymbols
var LOG_LEVEL_VERBOSE = 4, LOG_LEVEL_DEBUG = 3, LOG_LEVEL_INFO = 2, LOG_LEVEL_ERROR = 1;
// The current logging level. Modify this to change log level
//noinspection UnnecessaryLocalVariableJS
var gLogLevel = LOG_LEVEL_DEBUG;
//var gLogLevel = LOG_LEVEL_VERBOSE;
var gTraceLog = false;
function log(level, objs) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    if(gLogLevel >= level) {
        //noinspection JSHint
        console.log.apply(console, args);
        if(gTraceLog) {
            console.trace();
        }
    }
}



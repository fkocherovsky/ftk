"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFailure = exports.logTraffic = exports.logEx = exports.logE = exports.logI = exports.logGetNextSequence = void 0;
function logGetNextSequence() {
    if (++_lastSequence >= _maxSequence) {
        _lastSequence = _minSequence;
    }
    return _lastSequence;
}
exports.logGetNextSequence = logGetNextSequence;
let _minSequence = 1000000;
let _maxSequence = 9999999;
let _lastSequence = _minSequence;
function logI(s) {
    _log(s, 'I');
}
exports.logI = logI;
function logE(s) {
    _log(s, 'E');
}
exports.logE = logE;
function logEx(ex, details) {
    let s = _formatException(ex);
    if (details) {
        s = `${details}. ${s}`;
    }
    _log(s, 'E');
}
exports.logEx = logEx;
function logTraffic(dir, context, data) {
    logI(`|Comm|${dir.padEnd(8)}|${context.seq}|${context.loggablePathname}|${context.loggableParams}|${data}`);
}
exports.logTraffic = logTraffic;
function logFailure(exception, context, data) {
    let ex = _formatException(exception);
    logE(`|Comm|${context.seq}|${context.loggablePathname}|${context.loggableParams}|${data}. ${ex}`);
}
exports.logFailure = logFailure;
function _formatException(exception) {
    let stack = exception?.stack;
    if (stack && exception instanceof AggregateError && exception.errors?.length > 0) {
        stack = `[0]: ${exception.errors[0].message} (${exception.errors.length - 1} more errors). ` + stack;
    }
    return stack ?? `(stack unknown: ${exception?.message})`;
}
function _log(s, severity) {
    let now = new Date();
    let ss = `${now.toISOString()} |${severity}| - ${s}`;
    if (severity == 'E') {
        console.error(ss);
    }
    else {
        console.info(ss);
    }
}
//# sourceMappingURL=logger.js.map
import { AServerContext } from "./context";

/** generates server-specific cyclic sequence number */
export function logGetNextSequence() {
    // TODO: see how to make sequence node-dependent, so each server node will have different sequences range
    if (++_lastSequence >= _maxSequence) { _lastSequence = _minSequence; }
    return _lastSequence;
 }
 let _minSequence = 1000000;
 let _maxSequence = 9999999;
 let _lastSequence = _minSequence;
 

export type LogArguments = [message: string] | [obj: any] | [format: string, ...args: any[]];

// export function logI(...args: LogArguments)

export function logI(s: string){
    _log(s, 'I');
}

export function logE(s: string){
    _log(s, 'E');
}

export function logEx(ex: Error, details?: string){
    let s = _formatException(ex);
    if (details) { s = `${details}. ${s}`; }
    _log(s, 'E');
}

export type LogDirection = 'IN'                         | // incoming request (inbound service call)
                           'OUT'                        | // outgoing response (service call response)
                           'OUT(err)'                   | // outgoing service failure
                           'OUT(timedout)'              | // timeout before service completed
                           'OUT(err)(timedout)'         | // service failed after timeout expired
                           'FW'                         | // forward to external HTTP(s) service
                           'RE'                         | // reply from external HTTP(s) service
                           'DB';                          // internal DB logging

export function logTraffic(dir: LogDirection, context: AServerContext, data?: any): void {
    logI(`|Comm|${dir.padEnd(8)}|${context.seq}|${context.loggablePathname}|${context.loggableParams}|${data}`);
}

export function logFailure(exception: Error, context: AServerContext, data?: any): void {
    let ex = _formatException(exception);
    logE(`|Comm|${context.seq}|${context.loggablePathname}|${context.loggableParams}|${data}. ${ex}`);
}


function _formatException(exception: Error) {
    let stack = exception?.stack;
    if (stack && exception instanceof AggregateError && exception.errors?.length > 0) {
       // NOTE:
       // Special case: es2021 introduces AggregateError, and Node.js seeems to throw these a lot for I/O/networking operations with multiple attempts. Inner errors contain a separate error about each connect attempt, about each network interface which was tried, etc., e.g. IPv4, IPv6.
       // The AggregateError's stack itself doesn't have any meaningful message (and top of stack is 'AggregateError' with no details). The below attempts to prefix the stack with first error's message (e.g. ECONNREFUSED...), making it all more descriptive.
       // A more complete solution would be to dump all inner errors with their stacks, but since we're not so interested in Node.js internal stacks anyway, and our code never really uses AggregateError - there's no point to make dump so large (and possibly cut by Kibana)
       //
       stack = `[0]: ${exception.errors[0].message} (${exception.errors.length - 1} more errors). ` + stack;
    }
    return stack ?? `(stack unknown: ${exception?.message})`;
}

function _log(s: string, severity: string) {
    let now = new Date()
    let ss = `${now.toISOString()} |${severity}| - ${s}`;
    if (severity == 'E') {
        console.error(ss);
    } else {
        console.info(ss);
    }
}
 
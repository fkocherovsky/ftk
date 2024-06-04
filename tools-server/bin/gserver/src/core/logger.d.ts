import { AServerContext } from "./context";
export declare function logGetNextSequence(): number;
export type LogArguments = [message: string] | [obj: any] | [format: string, ...args: any[]];
export declare function logI(s: string): void;
export declare function logE(s: string): void;
export declare function logEx(ex: Error, details?: string): void;
export type LogDirection = 'IN' | 'OUT' | 'OUT(err)' | 'OUT(timedout)' | 'OUT(err)(timedout)' | 'FW' | 'RE' | 'DB';
export declare function logTraffic(dir: LogDirection, context: AServerContext, data?: any): void;
export declare function logFailure(exception: Error, context: AServerContext, data?: any): void;

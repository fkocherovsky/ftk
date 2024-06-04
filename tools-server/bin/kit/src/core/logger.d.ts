export declare function logGetNextSequence(): number;
export type LogArguments = [message: string] | [obj: any] | [format: string, ...args: any[]];
export declare function logI(s: string): void;
export declare function logE(s: string): void;
export declare function logEx(ex: Error): void;

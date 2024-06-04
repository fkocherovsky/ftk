import { Index } from '../../../kit/src/core';
import { AServerContext, AServiceContext } from './context';
export declare class Settings {
    static contentTypes: Index<string>;
}
export declare function webIsCompressible(size?: number, contentType?: string): boolean;
export declare function webGetContentType(file: string): string;
export declare function webServeError(error: Error, context: AServerContext, log?: boolean): Promise<void>;
export declare function webServeData(data: string, error: Error, context: AServiceContext): Promise<void>;

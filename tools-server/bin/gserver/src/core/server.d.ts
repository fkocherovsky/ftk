import { Index } from '../../../kit/src/core';
import { ServiceDescriptor } from './schema';
export declare let inDevelopment: boolean;
export declare let serverServices: Index<ServiceDescriptor>;
export declare class Settings {
    static serverRoot: string;
}
export declare function initializeServer(): Promise<void>;

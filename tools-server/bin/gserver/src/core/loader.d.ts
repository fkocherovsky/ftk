import { ServiceHandler } from './schema';
import { Index } from '../../../kit/src/core';
import { AServiceContext } from './context';
export declare let loaderServiceHandlers: Index<ServiceHandler>;
export declare let loaderContextClasses: Map<ConstructorOf<AServiceContext>, ConstructorOf<AServiceContext>>;
export declare function loaderScanModules(path?: string): Promise<void>;

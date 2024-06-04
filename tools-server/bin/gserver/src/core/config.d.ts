import { ServiceParamTypeName } from './schema';
import 'reflect-metadata';
export declare class ConfigMetadata {
    description?: string;
    encrypted?: boolean;
    notify?: boolean;
    dataType?: ServiceParamTypeName;
    configOnly?: boolean;
}
export declare function configurable(metadata?: ConfigMetadata): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function cfgGetMetadata(o: any, property?: string): ConfigMetadata;
export declare const G_SERVER_FOLDER_NAME = "gserver";
export declare let cfgDeploymentRoot: string;
export declare let cfgCoreEtcRoot: string;
export declare let cfgAppEtcRoot: string;
export declare let cfgServerBinRoot: string;
export declare let cfgAppSrcRoot: string;
export declare let configCoreSrcRoot: string;
export declare class StartupFlags {
    app: string;
    env: string;
    [key: string]: string | number | boolean;
}
export declare function cfgInitialize(): Promise<void>;
export declare function cfgApply(): Promise<void>;
export declare function cfgGetStartupFlags(): StartupFlags;
export declare function cfgLoadMetadata(fpath: string, configModule: any, configObject: any, configMetadata: ConfigMetadata): void;

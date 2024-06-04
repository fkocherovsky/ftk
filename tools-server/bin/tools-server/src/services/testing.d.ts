import { ServiceMetadata } from '../../../gserver/src/core/schema';
export declare class Settings {
    static cfgBoolTest1: boolean;
    static cfgBoolTest2: boolean;
    static cfgStringTest1: string;
    static cfgStringTest2: string;
    static cfgStringTest3: string;
    static cfgNumTest1: number;
    static cfgNumTest2: number;
    static cfgNumTest3: number;
    static cfgEncryptedTest: string;
    static someSecretBoo: string;
    static cfgMapIndexNumberTest: {
        [key: string]: number;
    };
}
export declare function helloWorld(req: string, context?: any): Promise<any>;
export declare namespace helloWorld {
    var metadata: ServiceMetadata;
}
export declare function helloWorld2(req: string, context?: any): Promise<any>;
export declare namespace helloWorld2 {
    var metadata: ServiceMetadata;
}

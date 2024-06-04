/// <reference types="node" />
import { Garray, Gmap, Gvalue, Index } from '../../../kit/src/core/types';
export type UserRole = string;
export type ServiceAccess = 'none' | 'internal' | 'unlimited' | 'public';
export type ServiceHandler = Function & {
    metadata: ServiceMetadata;
};
export type ServiceParamTypeName = 'boolean' | 'number' | 'string' | 'object' | 'boolean[]' | 'number[]' | 'string[]' | 'object[]';
export type ServiceResponseTypeName = 'null' | 'string' | 'xml' | 'object' | 'object[]';
export type ServiceResponseType = null | string | Gmap | Garray;
export type ServiceProtocol = 'http' | 'ws' | 'http-upload' | 'http-download';
export type ServiceMethod = 'GET' | 'POST' | 'PUT' | 'ANY';
export type ServiceFormat = 'json' | 'soap' | 'csv' | 'pdf' | 'raw';
export type ServiceAuthorization = 'none' | 'token' | 'basic' | 'soap';
export type ServiceAuthorizationCallback = () => {
    user: string;
    password: string;
};
export type ServiceAuthorizationOptions = ServiceAuthorization | {
    type: Extract<ServiceAuthorization, 'basic' | 'soap'>;
    settingsFN: ServiceAuthorizationCallback;
};
export type TokenValidationLevel = 'none' | 'never-expires' | 'full';
export interface ServiceMetadata {
    protocol?: ServiceProtocol;
    method?: ServiceMethod;
    format?: ServiceFormat;
    authorization?: ServiceAuthorizationOptions;
    tokenValidationLevel?: TokenValidationLevel;
    allowPasswordExpiredToken?: boolean;
    preserveRawJsonResponse?: boolean;
    rawContentType: string;
    rawResponseEncoding: BufferEncoding;
    timeout?: number;
    noTrafficLog: boolean;
}
export declare class ServiceDescriptor {
    constructor(name: string, handler: ServiceHandler);
    name: string;
    handler: ServiceHandler;
    schemaParams: ParamsDef;
    protocol: ServiceProtocol;
    method: ServiceMethod;
    format: ServiceFormat;
    access: ServiceAccess;
    bindings: Index<string>;
    permissions: {
        [key in UserRole]?: Permissions;
    };
    authorization: ServiceAuthorizationOptions;
    tokenValidationLevel: TokenValidationLevel;
    allowPasswordExpiredToken: boolean;
    preserveRawJsonResponse: boolean;
    rawContentType: string;
    rawResponseEncoding: BufferEncoding;
    timeout: number;
    noTrafficLog: boolean;
    isInternalService: boolean;
    isSystemService: boolean;
    isTestingService: boolean;
    isExposed: boolean;
    isBinary: boolean;
    get contentType(): string;
    getResponseTypes(): ServiceResponseTypeName[];
    getResponseEncoding(): BufferEncoding;
}
export declare class ParamsDef {
    names?: string[];
    types?: ServiceParamTypeName[];
    constructor(names?: string[], types?: ServiceParamTypeName[]);
    get size(): number;
    set(i: number, name: string, type: ServiceParamTypeName): void;
    getType(name: string): ServiceParamTypeName;
    getIndex(name: string): number;
    private _index;
}
// export declare function schemaParseParamValue(sd: ServiceDescriptor, name: string, s: string): Gvalue;
// export declare function schemaParseTypedValue(type: ServiceParamTypeName, o: Gvalue): Gvalue;
// export declare function schemaParseUntypedValue(o: Gvalue): Gvalue;

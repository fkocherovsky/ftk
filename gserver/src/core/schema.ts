// TODO: DECOR

import { isString, isArray, toNumber, toString, GError } from '../../../kit/src/core';
import { fromJson, Garray, Gmap, Gvalue, Index } from '../../../kit/src/core/types';
import { Utils } from '../../../kit/src/core/utils'

export type UserRole = string;
export type ServiceAccess = 'none' | 'internal' | 'unlimited' | 'public';
export type ServiceHandler = Function & { metadata: ServiceMetadata };
export type ServiceParamTypeName = 'boolean' | 'number' | 'string' | 'object' | 'boolean[]' | 'number[]' | 'string[]' | 'object[]';
export type ServiceResponseTypeName = 'null' | 'string' | 'xml' | 'object' | 'object[]';
export type ServiceResponseType = null | string | Gmap | Garray; // | Gxml
export type ServiceProtocol = 'http' | 'ws' | 'http-upload' | 'http-download';
export type ServiceMethod = 'GET' | 'POST' | 'PUT' | 'ANY';
export type ServiceFormat = 'json' | 'soap' | 'csv' | 'pdf' | 'raw';
export type ServiceAuthorization = 'none' | 'token' | 'basic' | 'soap';
export type ServiceAuthorizationCallback = () => { user: string; password: string; }; // currently, only used in 'basic' authorization
export type ServiceAuthorizationOptions = ServiceAuthorization | { type: Extract<ServiceAuthorization, 'basic' | 'soap'>; settingsFN: ServiceAuthorizationCallback; };
export type TokenValidationLevel = 'none' | 'never-expires' | 'full'; // 'none' is needed to have services where token is processed/validated if present, but it's optional for the service operation (authorization = 'none' is not the same), e.g. system/keepAlive

const SERVICE_FORMAT_METADATA: Index<{ contentType: string; responseTypes: ServiceResponseTypeName[] }> = {
   'json'   : { contentType: 'application/json;charset=UTF-8' , responseTypes: ['null', 'object', 'object[]'] },
   'soap'   : { contentType: 'application/soap+xml'           , responseTypes: ['null', 'xml']                },
   'csv'    : { contentType: 'text/plain;charset=UTF-8'       , responseTypes: ['null', 'object', 'object[]'] },
   'pdf'    : { contentType: 'application/pdf'                , responseTypes: ['null', 'string']             },
   'raw'    : { contentType: null                             , responseTypes: ['null', 'string']             },
   'default': { contentType: 'application/json;charset=UTF-8' , responseTypes: ['null']                       }
};

export interface ServiceMetadata {

    /** Service protocol (default is 'http') */
    protocol?: ServiceProtocol;
 
    /** Should only be used in schema-less services or when method = ANY is needed; in all other cases, this value is overridden by schema definition */
    method?: ServiceMethod;
 
    /** 'json' by default. The format for the outgoing non-stream serialization of the response (this sometimes affects how input is processed as well); note that for streamed responses, this is ignored as the streamed content is passed AS IS */
    format?: ServiceFormat;
 
    /** service authorization method, or a structure with authorization type and user/password-providing callback (authorization type default is 'soap' for SOAP services (format = 'soap'), 'token' for all others) */
    authorization?: ServiceAuthorizationOptions;
 
    /** 'full' (default) if a service requires session token validation (including expiration), 'never-expires' if expiration needn't be validated ('none' is reserved for internal system usages, do not use) */
    tokenValidationLevel?: TokenValidationLevel;
 
    /** false (default) if a service may not be called during login (specifically prior to password expiration validation), true otherwise (e.g. for login-related services) */
    allowPasswordExpiredToken?: boolean;
 
    /** if set to true, returns JSON response data AS IS without formatting it according to standard serialization structure (i.e. without 'success', 'results' etc.) */
    preserveRawJsonResponse?: boolean;
 
    /** specifies custom content-type for non-stream service response (typically combined with format = 'raw'); note that for streamed responses, this is ignored and a separate streaming-specific content-type/content-disposition logic is used */
    rawContentType: string;
 
    /** specifies custom content encoding for non-stream service response (typically combined with format = 'raw'); note that for streamed responses, this is ignored since streams are always passed AS IS, without altering encoding */
    rawResponseEncoding: BufferEncoding;
 
   /** timeout value if needs to override the one supplied by schema, or the one which is default (30 sec) */
   timeout?: number;
 
   /** prevents logging at service definition level (usable for services which should not be traffic-logged by design, e.g. ping/keepAlive and services responding with security-sensitive data */
   noTrafficLog: boolean;
}
 
export class ServiceDescriptor {

   constructor(name: string, handler: ServiceHandler) {
      this.name = name;
      this.handler = handler;
      this.schemaParams = null; // for typed (schema-taken) services - params are loaded later (when schema is loaded), for non-typed - this is left null so all params are passed unconverted

      let md = handler.metadata;
      this.protocol = md?.protocol ?? 'http';
      this.method = md?.method ?? 'GET';
      this.format = md?.format ?? 'json';
      this.authorization = md?.authorization ?? (this.format == 'soap' ? 'soap' : 'token');
      this.tokenValidationLevel = md?.tokenValidationLevel ?? 'full';
      this.allowPasswordExpiredToken = md?.allowPasswordExpiredToken ?? false;
      this.preserveRawJsonResponse = md?.preserveRawJsonResponse ?? false;
      this.rawContentType = md?.rawContentType ?? null;
      this.rawResponseEncoding = md?.rawResponseEncoding ?? null;
      this.timeout = md?.timeout ?? null;
      this.noTrafficLog = md?.noTrafficLog ?? false;

      let namelow = name.toLowerCase();
      if (namelow.startsWith('internal.')) { this.isInternalService = true; }
      if (namelow.startsWith('services.system.')) { this.isSystemService = true; }
      if (namelow.startsWith('services.testing.')) { this.isTestingService = true; }

      this.access = this.isInternalService ? 'internal' : (this.isTestingService || this.isSystemService ? 'unlimited' : 'none');
      this.isExposed = this.isSystemService || this.isInternalService || this.isTestingService ? true : false;
      this.isBinary = this.format == 'pdf' || this.rawResponseEncoding == 'binary';

      if (this.format == 'raw' && (!this.rawContentType || !this.rawResponseEncoding)) { throw new GError(`'raw' service format requires 'rawContentType' and 'rawResponseEncoding' to be explicitly specified in service metadata`); }
   }

   name: string;
   handler: ServiceHandler;
   schemaParams: ParamsDef;

   protocol: ServiceProtocol;
   method: ServiceMethod;
   format: ServiceFormat;
   access: ServiceAccess;
   bindings: Index<string> = {};
   permissions: { [key in UserRole]?: Permissions } = {};
   authorization: ServiceAuthorizationOptions;
   tokenValidationLevel: TokenValidationLevel;
   allowPasswordExpiredToken: boolean;
   preserveRawJsonResponse: boolean;
   rawContentType: string;
   rawResponseEncoding: BufferEncoding;
   timeout: number;
   noTrafficLog: boolean;

   isInternalService = false;
   isSystemService = false;
   isTestingService = false;
   isExposed = false;
   isBinary = false;

   get contentType()     { return this.rawContentType ?? (SERVICE_FORMAT_METADATA[this.format] || SERVICE_FORMAT_METADATA['default']).contentType; }
   getResponseTypes()    { return (SERVICE_FORMAT_METADATA[this.format] || SERVICE_FORMAT_METADATA['default']).responseTypes; }
   getResponseEncoding() { return this.rawResponseEncoding ?? (this.isBinary ? 'binary' : 'utf8'); }

}


export class ParamsDef {

   names?: string[];
   types?: ServiceParamTypeName[];

   constructor(names?: string[], types?: ServiceParamTypeName[]) {
      this.names = names || [];
      this.types = types || [];

      this._index = {};
      for (let i = 0, len = this.names.length; i < len; i++) {
         this._index[this.names[i]] = i;
      }
   }

   get size() { return this.names.length; }

   set(i: number, name: string, type: ServiceParamTypeName) {
      this.names[i] = name;
      this.types[i] = type;
      this._index[name] = i;
   }

   getType(name: string) {
      let i = this._index[name];
      return i == null ? null : this.types[i];
   }

   getIndex(name: string) {
      let i = this._index[name];
      return i == null ? -1 : i;
   }

   private _index: Index<number>;
}

export function schemaParseParamValue(sd: ServiceDescriptor, name: string, s: string) {
   let value: Gvalue = s;
   let type: ServiceParamTypeName;
   try {
      type = sd.schemaParams && sd.schemaParams.getType(name) || null;
      if (type != null) {
         value = schemaParseTypedValue(type, value);
      } else {
         value = schemaParseUntypedValue(value);
      }
   } catch (e) {
      // TODO: replace ${s} by ${logFormat(s)}, but first to implement formating
      throw new GError(`Failed to convert param '${name}' with value '${s}' to '${type}' in service '${sd.name}'`, e);
   }
   return value;
}

export function schemaParseTypedValue(type: ServiceParamTypeName, o: Gvalue) {
   let value: Gvalue = o;
   if (value === '' && type != 'string') { return null; }
 
   switch (type) {
      case 'boolean':
         // NOTE: cannot use toBoolean because e.g. toBoolean('0', undefined) returns true
         value = (o === true || o === 'true') ? true : ((o === false || o === 'false') ? false : undefined);
         break;
 
      case 'number':
         value = toNumber(o, undefined);
         break;
 
      case 'string':
         value = toString(value, undefined);
         break;
 
      case 'object':
         if (Utils.isPlainObject(o)) {
            value = o;
         } else if (isString(o) && o.charAt(0) == '{' && o.charAt(o.length - 1) == '}') {
            value = fromJson(o);
         } else {
            throw new Error(`Object parse failure: ${o}`);
         }
         break;
 
      case 'boolean[]':
      case 'number[]':
      case 'string[]':
      case 'object[]':
         if (isArray(o)) {
            value = o; // params=[value,value] (proper typed JSON primitives array)
         } else if (isString(o)) {
            let avalue: Gvalue[];
            if (o.charAt(0) == '[' && o.charAt(o.length - 1) == ']') {
               avalue = fromJson(o) as Gvalue[]; // params=value&params=value (note that values are strings in this case, since they're passed as query string params)
            } else {
               avalue = [ o ]; // params=value (1-item input comes as a single string, so it's converted to 1-item array of string first)
            }
             // type-checking (and typifying) primitive array items
            if (type == 'string[]') {
               value = avalue as Garray; // target is string[] and source is params=value&params=value, i.e. string[]
            } else if (!isString(avalue[0])) {
               value = avalue as Garray; // target is JSON primitive array (of any item type) and source was params='[value,value]' parsed into JSON primitive array by the above code
            } else {
                // target is not string[] and source is string[] (in params=value&params=value, query string values are always strings, so we should cast each array item (string) to the target primitive array item type)
               let atype = type.replace(/\W/g, '') as ServiceParamTypeName;
               value = (avalue as []).map(x => schemaParseTypedValue(atype, x)) as Garray;
            }
         } else {
            throw new Error(`Array parse failure: ${o}`);
         }
         break;
   }
   return value;
}

export function schemaParseUntypedValue(o: Gvalue) {
   let value: Gvalue = o;
   if (isString(o)) {
      if (o.charAt(0) == '[' && o.charAt(o.length - 1) == ']') {
         value = JSON.parse(o);
      } else if (o.charAt(0) == '{' && o.charAt(o.length - 1) == '}') {
         value = JSON.parse(o);
      }
   }
   return value;
}



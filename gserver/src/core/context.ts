import * as Fs from 'fs';
import * as Http from 'http';
import * as Path from 'path';
import * as Url from 'url';
import * as Util from 'util';
import * as Qs from 'querystring';
import * as Zlib from 'zlib';

import { Garray, Gmap, toJson } from '../../../kit/src/core/types';
import { Index, Gvalue, GError, isString, isArray } from '../../../kit/src/core';
import { override } from '../../../kit/src/core/decorators';
import { logEx, logGetNextSequence } from './logger';
import { hasEntries } from '../../../kit/src/core/query';

import { Settings as CommSettings } from './comm'
import { ServiceDescriptor, ServiceResponseType, ServiceResponseTypeName, UserRole, schemaParseParamValue } from './schema';
import { Settings as ServerSettings, inDevelopment } from './server';
import { webGetContentType, webIsCompressible, webServeError } from './web';
import { cfgDeploymentRoot } from './config';
// import { mergeDeep } from 'kit/core/object';

let _fsstat = Util.promisify(Fs.stat);
let _gzip = Util.promisify(Zlib.gzip);
let _deflate = Util.promisify(Zlib.deflate);

export enum Headers {
    SESSION_TOKEN = 'X-GM-token',
    MOBILE_TOKEN = 'X-GM-mobiletoken',
    UPLOAD_SIZE = 'X-GM-uploadsize',
    UPLOAD_NAME = 'X-GM-uploadname',
    PINCODE = 'X-GM-pincode'
 }

export abstract class AServerContext {

    constructor() {
        this._seq = logGetNextSequence();
    }

    get seq() { return this._seq; }
    protected _seq: number;
 
    abstract validate(): void;
    abstract validateClientVersion(): boolean; // overridable by apps to prevent older versions from servicing requests
 
    abstract getHeader(h: string): string;
    abstract get method(): string;
    abstract get url(): Url.UrlWithParsedQuery;
    abstract get pathname(): string;
    abstract get loggablePathname(): string;
    abstract get queryString(): string;
    abstract get requestContentType(): string;
    abstract getParams(): Index<Gvalue>;
    abstract getBody(): string;
    get loggableParams() { let params = this.getParams(); return params && hasEntries(params) && JSON.stringify(params) || ''; }
 
    // await-reads all asynchronous parts, so that the class can be used synchronously
    abstract seal(): Promise<this>;
    abstract format(): string;
 
    abstract setResponseHeader(name: string, value: string | number | string[]): void;
    abstract respond(status: number, data?: string | Fs.ReadStream, compress?: boolean): Promise<void>;
 
    abstract get isTimedout(): boolean;
    abstract get isCompleted(): boolean;
}

export class BasicServerContext extends AServerContext {

    constructor(req: Http.IncomingMessage, res: Http.ServerResponse) {
       super();
       this._request = req;
       this._response = res;
       // TODO: to implement cloneDeep
       // this._headers = cloneDeep(req.headers);
       this._headers = req.headers;
       this._url = Url.parse(req.url, true);
    }

    protected _url: Url.UrlWithParsedQuery;
    protected _headers: Http.IncomingHttpHeaders;
 
    get request() { return this._request; }
    protected _request: Http.IncomingMessage;
 
    get response() { return this._response; }
    protected _response: Http.ServerResponse;
 
    @override(AServerContext)
    validate() {
       if (!this.validateClientVersion()) { throw GError.UNSUPPORTED_CLIENT_VERSION(); }
    }
 
    // override by apps in case some logic is needed to prevent old versions from servicing a request
    @override(AServerContext)
    validateClientVersion() {
       return true;
    }
 
    @override(AServerContext)
    getHeader(h: string) {
       // return either string header value, or a value of a first multi-string header (i.e. the caller should know what he's doing otherwise he should access context.request.headers directly)
       let hh = this._headers[h.toLowerCase()];
       if (Array.isArray(hh)) { return hh[0]; }
       return hh as string;
    }
 
    @override(AServerContext)
    get method() { return this._request.method; }
 
    @override(AServerContext)
    get url() { return this._url; }
 
    @override(AServerContext)
    get pathname() { return this._url.pathname; } // path without query string
 
    @override(AServerContext)
    get loggablePathname() { return this._url.pathname; }
 
    @override(AServerContext)
    get queryString() { return Url.parse(this._request.url, false).query + ''; } // can't use this._url because it's has parsed (JSON) query, and we need string, hence the extra 'false' parse
 
    @override(AServerContext)
    get requestContentType() { return this._request.headers['content-type']; }
 
    @override(AServerContext)
    getParams(): Index<Gvalue> { return this._url.query; }
 
    @override(AServerContext)
    getBody() { return ''; }
 
    // await-reads all asynchronous parts, so that the class can be used synchronously
    @override(AServerContext)
    async seal(): Promise<this> { return this; }
 
    @override(AServerContext)
    format() { return this._request.url; }
 
    @override(AServerContext)
    setResponseHeader(name: string, value: string | number | string[]) {
       this.response.setHeader(name, value);
    }
 
    @override(AServerContext)
    async respond(status: number, data?: string | Fs.ReadStream, compress?: boolean) {
       if (this._completed) { return; }
       let res = this.response;
       try {
          if (data == null) {
             this.end(status);
          } else if (isString(data)) {
             let buf = Buffer.from(data || '', 'utf8');
 
             // NOTE: the order is important (for some reason IE doesn't work when 'deflate' is prefered over 'gzip')
             let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
             if (acceptEncoding.match(/\bgzip\b/)) {
                res.setHeader('Content-Encoding', 'gzip');
                this.end(status, await _gzip(buf));
             } else if (acceptEncoding.match(/\bdeflate\b/)) {
                res.setHeader('Content-Encoding', 'deflate');
                this.end(status, await _deflate(buf));
             } else {
                res.setHeader('Content-Length', buf.byteLength); // assuming known-for-client size transfer can work better, and with less overhead on the traffic/client
                this.end(status, buf);
             }
          } else if (data instanceof Fs.ReadStream) {
             let stream = data as Fs.ReadStream;
 
             // file sending is a long async process which will end(200) the operation upon streaming completion, i.e. in the successful completion, our "this.end" is not called, so we have to set this._completed ourselves
             stream.on('close', () => this._completed = true);
 
             stream.on('error', async e => {
                logEx(e);
                this.end(500);
             });
 
             // NOTE: the order is important (for some reason IE doesn't work when 'deflate' is preferred over 'gzip')
             let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
             if (acceptEncoding.match(/\bgzip\b/)) {
                res.setHeader('Content-Encoding', 'gzip');
                res.writeHead(status);
                stream.pipe(Zlib.createGzip()).pipe(res);
             } else if (acceptEncoding.match(/\bdeflate\b/)) {
                res.setHeader('Content-Encoding', 'deflate');
                res.writeHead(status);
                stream.pipe(Zlib.createDeflate()).pipe(res);
             } else {
                res.writeHead(status);
                stream.pipe(res);
             }
          } else {
             throw GError.APPLICATION_ERROR(`Unsupported output type: ${typeof data}`);
          }
       } catch (e) {
          logEx(e);
          this.end(500);
       }
    }
 
    protected end(status: number, data?: any) {
        if (this._completed) { return; }
        try {
           // TODO: the docs say that 'response.end' callback will be called when it's finished, but it's not related to async errors - see what happens when async error happens (we don't want to crash node)
           this._response.writeHead(status);
           this._response.end(data);
        } catch (e) {
           logEx(e);
           try { this._response.end(); } catch {}
        }
        this._completed = true;
    }
  
    @override(AServerContext)
    get isTimedout() { return this._timedout; }
    protected _timedout = false;
  
    @override(AServerContext)
    get isCompleted() { return this._completed; }
    protected _completed = false;
}
  
export abstract class AServiceContext extends AServerContext {

    constructor(sd: ServiceDescriptor) {
       super();
       this._sd = sd;
    }
 
    @override(AServerContext)
    validate() {
       if (!this.validateClientVersion()) { throw GError.UNSUPPORTED_CLIENT_VERSION(); }
       // TODO: add isTestingService and inDEvelopment settings
       // if (this._sd.isTestingService && !inDevelopment) { throw GError.NOT_FOUND(this._sd.name); }
       this.validateSessionToken();
    }
 
    // override by apps in case some logic is needed to prevent old versions from servicing a request
    @override(AServerContext)
    validateClientVersion() {
       return true;
    }
 
    refreshSessionToken(token: string) {
       this._sessionToken = token;  // let context feel it received this token
       this._extendedToken = token; // let context feel it should send this token in response as a refreshed one
       this.validateSessionToken();
    }
 
    validateSessionToken() {
        // TODO: to implement crypto and then uncomment the sectio below
    //    let token = this.sessionToken || null;
    //    let jwt = token == null ? null : new Jwt(token);
    //    if (this.sd != null && this.sd.tokenValidationLevel != 'none' && !ServerSettings.relaxedValidation && this.queryString.toLowerCase() != 'wsdl') {
    //       if (jwt == null) { throw GError.UNAUTHORIZED(); }
 
    //       jwt = new Jwt(token);
    //       if (jwt.passwordExpired && !this.sd.allowPasswordExpiredToken) { throw GError.PASSWORD_EXPIRED(); }
    //       if (this.sd.tokenValidationLevel != 'never-expires' && jwt.isExpired()) { throw GError.AUTHENTICATION_EXPIRED(); }
 
    //       this._user = jwt.user;
    //       this._role = jwt.role;
    //       this._passwordExpired = jwt.passwordExpired;
    //       this._sessionExpiration = jwt.expiration;
    //       if (this._user == null || this._role == null) { throw GError.UNAUTHORIZED(); }
    //    } else {
    //       if (jwt == null) { return; }
    //       this._user = jwt.user;
    //       this._role = jwt.role;
    //       this._passwordExpired = jwt.passwordExpired;
    //       this._sessionExpiration = jwt.expiration;
    //    }
 
    //    // NOTES:
    //    // - token is extended only if it has: proper role, user, creation time and didn't pass max extension limit
    //    // - token is only extended once-in-a-while, to avoid extending on each and every request
    //    if (this._user != null && this._role != null && jwt.canExtend() && jwt.shouldExtend()) {
    //       this._extendedToken = jwt.extend();
    //    }
    }
 
    // service descriptor - represents design-time service metadata
    get sd() { return this._sd; }
 
    get user() { return this._user; }
    get role() { return this._role; }
    get passwordExpired() { return this._passwordExpired; }
    get sessionExpiration() { return this._sessionExpiration; }
    get extendedToken() { return this._extendedToken; }
 
    protected _sd: ServiceDescriptor;
    protected _user: string;
    protected _role: UserRole;
    protected _passwordExpired: boolean;
    protected _sessionExpiration: number;
    protected _extendedToken: string;
 
    get sessionToken() { return this._sessionToken; }
    protected _sessionToken: string;
 
    protected typifyParams(params: Qs.ParsedUrlQuery): Index<Gvalue> {
       let pdefs = this._sd.schemaParams;
       let outparams: Index<Gvalue> = {};
 
       // TODO:
       // currently, context.getParams() returns Qs.ParsedUrlQuery (values are string|string[]), while many of the REST/WS services supply their input as proper, typed JSON.
       // currently, that proper JSON is stringified so that it will mimic Qs.ParsedUrlQuery, but it will be much better to change the below code to accept either string values
       // or raw JSON primitives, so we can avoid these extra stringify-and-parse passes
       //
 
       if (pdefs == null) {
          // untyped version (no schema entry for this service)
          for (let [k, v] of Object.entries(params)) {
             let value: Gvalue = schemaParseParamValue(this._sd, k, isArray(v) ? JSON.stringify(v) : v);
             if (value !== undefined) { outparams[k] = value; }
          }
       } else {
          // typed version (convert input according to schema, and only pass fields defined in schema, dropping others)
          for (let i = 0, len = pdefs.size; i < len; i++) {
             let k = pdefs.names[i];
             let v: Gvalue = params[k];
             if (v !== undefined) {
                let value: Gvalue = schemaParseParamValue(this._sd, k, isArray(v) ? JSON.stringify(v) : v);
                if (value !== undefined) { outparams[k] = value; }
             }
          }
       }
       return outparams;
    }
 
    formatResponse(data: ServiceResponseType, exception?: Error) {
       if (exception != null) {
          let error = (exception instanceof GError) ? exception : GError.GENERAL_ERROR(); // do not expose exception details in response
          let code = error.code;
          // TODO: expose exceptions
          let message = (inDevelopment/* && ServerSettings.exposeExceptions*/) ? logEx(exception) : error.message;
 
          if (this.sd.format == 'json') {
             return toJson({ success: false, error: code, message: message });
          } else if (this.sd.format == 'soap') {
             return `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault><faultcode>${code}</faultcode><faultstring>${message || ''}}</faultstring></S:Fault></S:Body></S:Envelope>`;
          } else if (this.sd.format == 'csv') {
             return null;
          } else if (this.sd.format == 'pdf') {
             return null;
          } else if (this.sd.format == 'raw') {
             return null;
          } else {
             throw Error(`Unsupported format: ${this.sd.format}`);
          }
       } else {
          // TODO: to implement Gxml and uncomment the line below
          // let type: ServiceResponseTypeName = data == null ? 'null' : (isString(data) ? 'string' : (data instanceof Gxml ? 'xml' : (isArray(data) ? 'object[]' : 'object')));
          let type: ServiceResponseTypeName = data == null ? 'null' : (isString(data) ? 'string' : (isArray(data) ? 'object[]' : 'object'));
          if (!this.sd.getResponseTypes().includes(type)) { throw Error(`Unsupported format: ${this.sd.format}, for data of type (${ type }): ${typeof data}`); }
 
          if (this.sd.format == 'json') {
             if (this.sd.preserveRawJsonResponse) {
                return data == null ? null : toJson(data);
             } else {
                let array: Garray = type == 'null' ? null : (type == 'object[]' ? data as Garray : [ data as Gmap ]);
                // TODO: to implement dbGetTotal(array) if needed ans then call it instead the stingified version ('dbGetTotal(array)')
                let total; // meanwhile undefined, but should be total = dbGetTotal(array)
                return toJson(array == null ? { success: true } : { success: true, results: array, total });
             }
        //   } else if (this.sd.format == 'soap') {
        //      return data == null ? null : (data as Gxml).toString();
        //   } else if (this.sd.format == 'csv') {
        //      return data == null ? null : toCsv((type == 'object[]' ? data as Garray : [ data as Gmap ]));
          } else if (this.sd.format == 'pdf') {
             return data as string;
          } else if (this.sd.format == 'raw') {
             return data as string;
          } else {
             throw Error(`Unsupported format: ${this.sd.format}`);
          }
       }
    }
 
    // explicitly abstract-override 'respond' method with string-only param to prevent it from being able to send stream (this is reserved for BasicServerContext only)
    abstract respond(status: number, data?: string, compress?: boolean): Promise<void>;
 
}
 
export class HttpServiceContext extends AServiceContext {

    constructor(req: Http.IncomingMessage, res: Http.ServerResponse, sd: ServiceDescriptor, url: Url.UrlWithParsedQuery, aliasurl?: Url.UrlWithParsedQuery, aliasparams?: Qs.ParsedUrlQuery) {
       super(sd);
       this._request = req;
       this._response = res;
 
       // TODO: cloneDeep
       // this._headers = cloneDeep(req.headers);
       this._headers = req.headers;
       this._aliasurl = aliasurl;
       this._aliasparams = aliasparams || {};
       this._url = url;
       this._sessionToken = this._headers[Headers.SESSION_TOKEN.toLowerCase() || null] as string;
    }
 
    @override(AServiceContext)
    validate() {
        // TODO: ServerSettings.relaxedValidation
        if (!this._aliasurl && this._sd.method != 'ANY' /*&& !ServerSettings.relaxedValidation*/ && this._sd.method != this.method) {
          throw GError.METHOD_NOT_ALLOWED(); // we trust alias mapping on HTTP method selection, but validate everything else
        }
       super.validate();
    }
 
    //////////////////////////////////////////////////////////////////////////
    // HTTP HANDLING
    //
 
    get request() { return this._request; }
    protected _request: Http.IncomingMessage;
 
    get response() { return this._response; }
    protected _response: Http.ServerResponse;
 
    @override(AServiceContext)
    getHeader(h: string) {
       // returns either string header value, or a value of a first multi-string header (i.e. the caller should know what he's doing otherwise he should access context.request.headers directly)
       let hh = this._headers[h.toLowerCase()];
       if (Array.isArray(hh)) { return hh[0]; }
       return hh as string;
    }
    protected _headers: Http.IncomingHttpHeaders;
 
    @override(AServiceContext)
    get method() { return this._request.method; }
 
    @override(AServiceContext)
    get url() { return this._url; }
    protected _url: Url.UrlWithParsedQuery;
 
    get aliasurl() { return this._aliasurl; }
    protected _aliasurl: Url.UrlWithParsedQuery;
 
    // path without query string (either from orignal URL, if alias was used, or from the target actual service name URL)
    @override(AServiceContext)
    get pathname() { return this._url.pathname; }
 
    @override(AServiceContext)
    get loggablePathname() {
       if (this._loggablePathname != null) { return this._loggablePathname; }
       this._loggablePathname = this._aliasurl && this._aliasurl.pathname || this._url.pathname;
       if (this._loggablePathname.toLowerCase().startsWith(ServerSettings.serverRoot)) { this._loggablePathname = this._loggablePathname.substr(ServerSettings.serverRoot.length - 1); }
       return this._loggablePathname;
    }
    protected _loggablePathname: string;
 
    @override(AServiceContext)
    get queryString() {
       if (this._queryString != null) { return this._queryString; }
       this._queryString = Url.parse(this._request.url, false).query + ''; // can't use this._url because it's has parsed (JSON) query, and we need string, hence the extra 'false' parse
       return this._queryString;
    }
    protected _queryString: string;
 
    @override(AServiceContext)
    get requestContentType() { return this._request.headers['content-type']; }
 
    @override(AServiceContext)
    getBody() {
       if (this._body != null) { return this._body; }
       throw new Error(`Attempt to accesss request body before it has been fully loaded`);
    }
    private async _readBody() {
       if (this._body != null) { return this._body; }
 
       // TODO: see how to merge this with comm.ts stuff, there's a very similar logic in 'forward' call
       // TODO: see if this await hack is the right way to await for on(...) events; people are not sure on SO about this
       let body = '';
       await new Promise((resolve, reject) => {
          this._request.on('data', data => {
             body += data; // TODO: encoding works Ok for some reason even with non-English data, but check again (the 'data' thing is ArrayBuffer, not string; so not clear how it works)
             if (body.length > CommSettings.maxHttpBodySize) {
                body = '';
                this._request.connection.destroy();
                reject(GError.PAYLOAD_TOO_LARGE()); // this is needed because connection.destroy() doesn't cause error - see note in comm.ts
             }
          });
          this._request.on('end', resolve);
          this._request.on('error', reject); // TODO: see if actually happens, also, there are: timeout, abort, see what they do and if they happen
       });
       this._body = body;
       return this._body;
    }
    protected _body: string;
 
    @override(AServiceContext)
    getParams(): Index<Gvalue> {
       if (this._params != null) { return this._params; }
 
       // only return params which come with request, body has not been yet read at this moment
       let params = this._url.query as Qs.ParsedUrlQuery;
       // TODO: check maybe  deep merge is needed
       // if (this._aliasparams != null) { params = mergeDeep(params, this._aliasparams); }
       if (this._aliasparams != null) { params = { ...params, ...this._aliasparams }; }
       return params;
    }
 
    // used to get unfiltered params (before schema-params filtering and type conversion), e.g. for logging/using of non-schema-defined params
    protected getAllParams(): Index<Gvalue> {
       if (this._allparams) { return this._allparams; }
       return this.getParams();
    }
 
    protected async _readParams() {
       let p = this._url.query;
       // TODO: check if deep merge is needed
       // if (this._aliasparams != null) { p = mergeDeep(p, this._aliasparams); }
       if (this._aliasparams != null) { p = { ...p, ...this._aliasparams}; }
 
       if (this.method == 'GET') {
          this._params = this.typifyParams(p);
          this._allparams = p;
       } else {
          let body = await this._readBody();
          if (body == null || body.length == 0) {
             this._params = this.typifyParams(p);
             this._allparams = p;
          } else if (this.requestContentType == null) {
             throw new Error(`Content-Type' is mandatory for non-GET requests`);
          } else if (this.requestContentType.startsWith('application/x-www-form-urlencoded')) {
             p = Object.assign(p, Qs.parse(body));
             this._params = this.typifyParams(p);
             this._allparams = p;
          } else if (this.requestContentType.startsWith('application/json')) {
             this._params = Object.assign(this.typifyParams(p), JSON.parse(body));
             this._allparams = Object.assign(p, JSON.parse(body));
          } else if (this.requestContentType.startsWith('application/soap+xml') || this.requestContentType.startsWith('text/xml') || this.requestContentType.startsWith('application/xml')) {
             this._params = this.typifyParams(p); // XML will be taken directly from body, within service handlers (NOTE: in Java we used to check service handler method signature for Gxml params, but it's close-to-impossible in JS, so for such a rare usage - we should be good for now)
             this._allparams = p;
          } else if (this.requestContentType.startsWith('text/plain')) {
             this._params = this.typifyParams(p); // plain text will be taken directly from body, within service handlers (this is used e.g. for logging services)
             this._allparams = p;
          } else {
             throw new Error(`Unsupported content type '${this.requestContentType}' in '${this.method}' request`);
          }
       }
    }
    protected _params: Index<Gvalue>;
    protected _aliasparams: Qs.ParsedUrlQuery;
    protected _allparams: Index<Gvalue>; // this._allparams - are all original params, while this._params only includes params which are defined in schema.json and after they were typified
 
    // await-reads all asynchronous parts, so that the class can be used synchronously
    @override(AServiceContext)
    async seal(): Promise<this> {
       if (this._sealed) { return this; }
       await this._readBody();
       await this._readParams();
 
       if (this._sd.timeout) {
          this._request.setTimeout(0);
          this._timer = setTimeout(async () => {
             if (!this._completed) {
                this._timedout = true;
                await webServeError(GError.OPERATION_TIMEOUT(), this);
             }
          }, this._sd.timeout).unref();
       }
 
       this._sealed = true;
       return this;
    }
    protected _timer: NodeJS.Timeout;
    protected _sealed = false;
 
    // NOTE:
    // the Java version of this method tries to 'reverse-build' input from params and body; this is super-complicated and not sure how much needed;
    // here, we simply return path plus params hoping their actual inbound serialization location - is not important;
    // see if this is indeed good enough or we need to port the whole shebang from Java to make sure we log the actual raw format of all params (alias, query, body)
    @override(AServiceContext)
    format() {
       return this.loggablePathname + this.loggableParams;
    }
 
    @override(AServiceContext)
    get loggableParams() {
       let params = this._allparams ?? this.getParams(); // include non-typified (original) params as well, so that even params not in schema.json - are printed
       return (params && hasEntries(params) && JSON.stringify(params) || '') + (this.sd.format == 'soap' && this._body ? 'BODY=' + this._body : ''); // dump SOAP body, but only if we already read it
    }
 
    @override(AServiceContext)
    setResponseHeader(name: string, value: string | number | string[]) {
       this.response.setHeader(name, value);
    }
 
    @override(AServiceContext)
    async respond(status: number, data?: string, compress?: boolean) {
       if (this._timer) {
          clearTimeout(this._timer);
          this._timer = null;
       }
       if (this._completed) { return; }
       let res = this._response;
       try {
          res.setHeader('Content-Type', this.sd.contentType);
          if (this.extendedToken) { res.setHeader(Headers.SESSION_TOKEN, this.extendedToken); }
 
          if (data == null) {
             this.end(status);
          } else if (isString(data)) {
             let buf = Buffer.from(data || '', this.sd.getResponseEncoding());
 
             // NOTE: the order is important (for some reason IE doesn't work when 'deflate' is prefered over 'gzip')
             let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
             if (acceptEncoding.match(/\bgzip\b/)) {
                res.setHeader('Content-Encoding', 'gzip');
                this.end(status, await _gzip(buf));
             } else if (acceptEncoding.match(/\bdeflate\b/)) {
                res.setHeader('Content-Encoding', 'deflate');
                this.end(status, await _deflate(buf));
             } else {
                res.setHeader('Content-Length', buf.byteLength); // assuming known-for-client size transfer can work better, and with less overhead on the traffic/client
                this.end(status, buf);
             }
          } else {
             throw GError.APPLICATION_ERROR(`Unsupported output type: ${typeof data}`);
          }
       } catch (e) {
          logEx(e);
          this.end(500);
       }
    }
 
    /** NOTE: using this method typically goes with {@link ServiceMetadata#preserveRawResponse}, as there's no point to return anything for redirect requests */
    redirect(url: string) {
       if (this._completed) { return; }
       try {
          this._response.writeHead(302, { 'Location': url });
          this._response.end();
       } catch (e) {
          logEx(e);
          try { this._response.end(); } catch {}
       }
       this._completed = true;
    }
 
    /** NOTE: using this method typically goes with {@link ServiceMetadata#preserveRawResponse}, as there's no point to return anything once file has been streamed */
    async stream(path: string, contentType?: string) {
       if (this._completed) { return; }
 
       // NOTE: no try-catch here because this is called from service handler, so it's OK to propagate all exception up the stack - they'll be logged correctly and error response will be sent correctly
       if (!Path.isAbsolute(path)) { path = Path.resolve(path); }
       if (!path.toLowerCase().startsWith(cfgDeploymentRoot.toLowerCase())) { throw new GError(`Non-rooted path: ${path}`); }
 
       let stat: Fs.Stats;
       try {
          stat = await _fsstat(path);
       } catch (e) {
          throw GError.NOT_FOUND();
       }
 
       let context = new BasicServerContext(this.request, this.response);
       let ct = contentType ?? webGetContentType(path);
       if (ct != null) { context.setResponseHeader('Content-Type', ct); }
 
       let name = Path.basename(path);
       context.setResponseHeader('Content-Disposition', `attachment; filename="${name.replace(/\W/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`);
 
       let stream = Fs.createReadStream(path);
       this._completed = true; // once stream is created - there's no way to call any of 'this' context's methods, so complete this one and 'transfer' any further logic to BasicServerContext
       await context.respond(200, stream, webIsCompressible(stat.size, ct));
    }
 
    protected end(status: number, data?: any) {
       if (this._completed) { return; }
       try {
          // TODO: the docs say that 'response.end' callback will be called when it's finished, but it's not related to async errors - see what happens when async error happens (we don't want to crash node)
          this._response.writeHead(status);
          this._response.end(data);
       } catch (e) {
          logEx(e);
          try { this._response.end(); } catch {}
       }
       this._completed = true;
    }
 
    @override(AServiceContext)
    get isTimedout() { return this._timedout; }
    protected _timedout = false;
 
    @override(AServiceContext)
    get isCompleted() { return this._completed; }
    protected _completed = false;
}
 
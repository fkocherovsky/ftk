/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import * as Fs from 'fs';
import * as Http from 'http';
import * as Url from 'url';
import * as Qs from 'querystring';
import { Index, Gvalue } from '../../../kit/src/core';
import { ServiceDescriptor, ServiceResponseType, UserRole } from './schema';
export declare enum Headers {
    SESSION_TOKEN = "X-GM-token",
    MOBILE_TOKEN = "X-GM-mobiletoken",
    UPLOAD_SIZE = "X-GM-uploadsize",
    UPLOAD_NAME = "X-GM-uploadname",
    PINCODE = "X-GM-pincode"
}
export declare abstract class AServerContext {
    constructor();
    get seq(): number;
    protected _seq: number;
    abstract validate(): void;
    abstract validateClientVersion(): boolean;
    abstract getHeader(h: string): string;
    abstract get method(): string;
    abstract get url(): Url.UrlWithParsedQuery;
    abstract get pathname(): string;
    abstract get loggablePathname(): string;
    abstract get queryString(): string;
    abstract get requestContentType(): string;
    abstract getParams(): Index<Gvalue>;
    abstract getBody(): string;
    get loggableParams(): string;
    abstract seal(): Promise<this>;
    abstract format(): string;
    abstract setResponseHeader(name: string, value: string | number | string[]): void;
    abstract respond(status: number, data?: string | Fs.ReadStream, compress?: boolean): Promise<void>;
    abstract get isTimedout(): boolean;
    abstract get isCompleted(): boolean;
}
export declare class BasicServerContext extends AServerContext {
    constructor(req: Http.IncomingMessage, res: Http.ServerResponse);
    protected _url: Url.UrlWithParsedQuery;
    protected _headers: Http.IncomingHttpHeaders;
    get request(): Http.IncomingMessage;
    protected _request: Http.IncomingMessage;
    get response(): Http.ServerResponse<Http.IncomingMessage>;
    protected _response: Http.ServerResponse;
    validate(): void;
    validateClientVersion(): boolean;
    getHeader(h: string): string;
    get method(): string;
    get url(): Url.UrlWithParsedQuery;
    get pathname(): string;
    get loggablePathname(): string;
    get queryString(): string;
    get requestContentType(): string;
    getParams(): Index<Gvalue>;
    getBody(): string;
    seal(): Promise<this>;
    format(): string;
    setResponseHeader(name: string, value: string | number | string[]): void;
    respond(status: number, data?: string | Fs.ReadStream, compress?: boolean): Promise<void>;
    protected end(status: number, data?: any): void;
    get isTimedout(): boolean;
    protected _timedout: boolean;
    get isCompleted(): boolean;
    protected _completed: boolean;
}
export declare abstract class AServiceContext extends AServerContext {
    constructor(sd: ServiceDescriptor);
    validate(): void;
    validateClientVersion(): boolean;
    refreshSessionToken(token: string): void;
    validateSessionToken(): void;
    get sd(): ServiceDescriptor;
    get user(): string;
    get role(): string;
    get passwordExpired(): boolean;
    get sessionExpiration(): number;
    get extendedToken(): string;
    protected _sd: ServiceDescriptor;
    protected _user: string;
    protected _role: UserRole;
    protected _passwordExpired: boolean;
    protected _sessionExpiration: number;
    protected _extendedToken: string;
    get sessionToken(): string;
    protected _sessionToken: string;
    protected typifyParams(params: Qs.ParsedUrlQuery): Index<Gvalue>;
    formatResponse(data: ServiceResponseType, exception?: Error): string;
    abstract respond(status: number, data?: string, compress?: boolean): Promise<void>;
}
export declare class HttpServiceContext extends AServiceContext {
    constructor(req: Http.IncomingMessage, res: Http.ServerResponse, sd: ServiceDescriptor, url: Url.UrlWithParsedQuery, aliasurl?: Url.UrlWithParsedQuery, aliasparams?: Qs.ParsedUrlQuery);
    validate(): void;
    get request(): Http.IncomingMessage;
    protected _request: Http.IncomingMessage;
    get response(): Http.ServerResponse<Http.IncomingMessage>;
    protected _response: Http.ServerResponse;
    getHeader(h: string): string;
    protected _headers: Http.IncomingHttpHeaders;
    get method(): string;
    get url(): Url.UrlWithParsedQuery;
    protected _url: Url.UrlWithParsedQuery;
    get aliasurl(): Url.UrlWithParsedQuery;
    protected _aliasurl: Url.UrlWithParsedQuery;
    get pathname(): string;
    get loggablePathname(): string;
    protected _loggablePathname: string;
    get queryString(): string;
    protected _queryString: string;
    get requestContentType(): string;
    getBody(): string;
    private _readBody;
    protected _body: string;
    getParams(): Index<Gvalue>;
    protected getAllParams(): Index<Gvalue>;
    protected _readParams(): Promise<void>;
    protected _params: Index<Gvalue>;
    protected _aliasparams: Qs.ParsedUrlQuery;
    protected _allparams: Index<Gvalue>;
    seal(): Promise<this>;
    protected _timer: NodeJS.Timeout;
    protected _sealed: boolean;
    format(): string;
    get loggableParams(): string;
    setResponseHeader(name: string, value: string | number | string[]): void;
    respond(status: number, data?: string, compress?: boolean): Promise<void>;
    redirect(url: string): void;
    stream(path: string, contentType?: string): Promise<void>;
    protected end(status: number, data?: any): void;
    get isTimedout(): boolean;
    protected _timedout: boolean;
    get isCompleted(): boolean;
    protected _completed: boolean;
}

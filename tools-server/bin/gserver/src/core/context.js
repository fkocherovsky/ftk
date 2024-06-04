"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServiceContext = exports.AServiceContext = exports.BasicServerContext = exports.AServerContext = exports.Headers = void 0;
const Fs = require("fs");
const Path = require("path");
const Url = require("url");
const Util = require("util");
const Qs = require("querystring");
const Zlib = require("zlib");
const types_1 = require("../../../kit/src/core/types");
const core_1 = require("../../../kit/src/core");
const decorators_1 = require("../../../kit/src/core/decorators");
const logger_1 = require("./logger");
const query_1 = require("../../../kit/src/core/query");
const comm_1 = require("./comm");
const schema_1 = require("./schema");
const server_1 = require("./server");
const web_1 = require("./web");
const config_1 = require("./config");
let _fsstat = Util.promisify(Fs.stat);
let _gzip = Util.promisify(Zlib.gzip);
let _deflate = Util.promisify(Zlib.deflate);
var Headers;
(function (Headers) {
    Headers["SESSION_TOKEN"] = "X-GM-token";
    Headers["MOBILE_TOKEN"] = "X-GM-mobiletoken";
    Headers["UPLOAD_SIZE"] = "X-GM-uploadsize";
    Headers["UPLOAD_NAME"] = "X-GM-uploadname";
    Headers["PINCODE"] = "X-GM-pincode";
})(Headers = exports.Headers || (exports.Headers = {}));
class AServerContext {
    constructor() {
        this._seq = (0, logger_1.logGetNextSequence)();
    }
    get seq() { return this._seq; }
    get loggableParams() { let params = this.getParams(); return params && (0, query_1.hasEntries)(params) && JSON.stringify(params) || ''; }
}
exports.AServerContext = AServerContext;
class BasicServerContext extends AServerContext {
    constructor(req, res) {
        super();
        this._timedout = false;
        this._completed = false;
        this._request = req;
        this._response = res;
        this._headers = req.headers;
        this._url = Url.parse(req.url, true);
    }
    get request() { return this._request; }
    get response() { return this._response; }
    validate() {
        if (!this.validateClientVersion()) {
            throw core_1.GError.UNSUPPORTED_CLIENT_VERSION();
        }
    }
    validateClientVersion() {
        return true;
    }
    getHeader(h) {
        let hh = this._headers[h.toLowerCase()];
        if (Array.isArray(hh)) {
            return hh[0];
        }
        return hh;
    }
    get method() { return this._request.method; }
    get url() { return this._url; }
    get pathname() { return this._url.pathname; }
    get loggablePathname() { return this._url.pathname; }
    get queryString() { return Url.parse(this._request.url, false).query + ''; }
    get requestContentType() { return this._request.headers['content-type']; }
    getParams() { return this._url.query; }
    getBody() { return ''; }
    async seal() { return this; }
    format() { return this._request.url; }
    setResponseHeader(name, value) {
        this.response.setHeader(name, value);
    }
    async respond(status, data, compress) {
        if (this._completed) {
            return;
        }
        let res = this.response;
        try {
            if (data == null) {
                this.end(status);
            }
            else if ((0, core_1.isString)(data)) {
                let buf = Buffer.from(data || '', 'utf8');
                let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
                if (acceptEncoding.match(/\bgzip\b/)) {
                    res.setHeader('Content-Encoding', 'gzip');
                    this.end(status, await _gzip(buf));
                }
                else if (acceptEncoding.match(/\bdeflate\b/)) {
                    res.setHeader('Content-Encoding', 'deflate');
                    this.end(status, await _deflate(buf));
                }
                else {
                    res.setHeader('Content-Length', buf.byteLength);
                    this.end(status, buf);
                }
            }
            else if (data instanceof Fs.ReadStream) {
                let stream = data;
                stream.on('close', () => this._completed = true);
                stream.on('error', async (e) => {
                    (0, logger_1.logEx)(e);
                    this.end(500);
                });
                let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
                if (acceptEncoding.match(/\bgzip\b/)) {
                    res.setHeader('Content-Encoding', 'gzip');
                    res.writeHead(status);
                    stream.pipe(Zlib.createGzip()).pipe(res);
                }
                else if (acceptEncoding.match(/\bdeflate\b/)) {
                    res.setHeader('Content-Encoding', 'deflate');
                    res.writeHead(status);
                    stream.pipe(Zlib.createDeflate()).pipe(res);
                }
                else {
                    res.writeHead(status);
                    stream.pipe(res);
                }
            }
            else {
                throw core_1.GError.APPLICATION_ERROR(`Unsupported output type: ${typeof data}`);
            }
        }
        catch (e) {
            (0, logger_1.logEx)(e);
            this.end(500);
        }
    }
    end(status, data) {
        if (this._completed) {
            return;
        }
        try {
            this._response.writeHead(status);
            this._response.end(data);
        }
        catch (e) {
            (0, logger_1.logEx)(e);
            try {
                this._response.end();
            }
            catch { }
        }
        this._completed = true;
    }
    get isTimedout() { return this._timedout; }
    get isCompleted() { return this._completed; }
}
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "validate", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "validateClientVersion", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "getHeader", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "method", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "url", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "pathname", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "loggablePathname", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "queryString", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "requestContentType", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], BasicServerContext.prototype, "getParams", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "getBody", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BasicServerContext.prototype, "seal", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "format", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BasicServerContext.prototype, "setResponseHeader", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Boolean]),
    __metadata("design:returntype", Promise)
], BasicServerContext.prototype, "respond", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "isTimedout", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], BasicServerContext.prototype, "isCompleted", null);
exports.BasicServerContext = BasicServerContext;
class AServiceContext extends AServerContext {
    constructor(sd) {
        super();
        this._sd = sd;
    }
    validate() {
        if (!this.validateClientVersion()) {
            throw core_1.GError.UNSUPPORTED_CLIENT_VERSION();
        }
        this.validateSessionToken();
    }
    validateClientVersion() {
        return true;
    }
    refreshSessionToken(token) {
        this._sessionToken = token;
        this._extendedToken = token;
        this.validateSessionToken();
    }
    validateSessionToken() {
    }
    get sd() { return this._sd; }
    get user() { return this._user; }
    get role() { return this._role; }
    get passwordExpired() { return this._passwordExpired; }
    get sessionExpiration() { return this._sessionExpiration; }
    get extendedToken() { return this._extendedToken; }
    get sessionToken() { return this._sessionToken; }
    typifyParams(params) {
        let pdefs = this._sd.schemaParams;
        let outparams = {};
        if (pdefs == null) {
            for (let [k, v] of Object.entries(params)) {
                let value = (0, schema_1.schemaParseParamValue)(this._sd, k, (0, core_1.isArray)(v) ? JSON.stringify(v) : v);
                if (value !== undefined) {
                    outparams[k] = value;
                }
            }
        }
        else {
            for (let i = 0, len = pdefs.size; i < len; i++) {
                let k = pdefs.names[i];
                let v = params[k];
                if (v !== undefined) {
                    let value = (0, schema_1.schemaParseParamValue)(this._sd, k, (0, core_1.isArray)(v) ? JSON.stringify(v) : v);
                    if (value !== undefined) {
                        outparams[k] = value;
                    }
                }
            }
        }
        return outparams;
    }
    formatResponse(data, exception) {
        if (exception != null) {
            let error = (exception instanceof core_1.GError) ? exception : core_1.GError.GENERAL_ERROR();
            let code = error.code;
            let message = (server_1.inDevelopment) ? (0, logger_1.logEx)(exception) : error.message;
            if (this.sd.format == 'json') {
                return (0, types_1.toJson)({ success: false, error: code, message: message });
            }
            else if (this.sd.format == 'soap') {
                return `<?xml version='1.0' encoding='UTF-8'?><S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/"><S:Body><S:Fault><faultcode>${code}</faultcode><faultstring>${message || ''}}</faultstring></S:Fault></S:Body></S:Envelope>`;
            }
            else if (this.sd.format == 'csv') {
                return null;
            }
            else if (this.sd.format == 'pdf') {
                return null;
            }
            else if (this.sd.format == 'raw') {
                return null;
            }
            else {
                throw Error(`Unsupported format: ${this.sd.format}`);
            }
        }
        else {
            let type = data == null ? 'null' : ((0, core_1.isString)(data) ? 'string' : ((0, core_1.isArray)(data) ? 'object[]' : 'object'));
            if (!this.sd.getResponseTypes().includes(type)) {
                throw Error(`Unsupported format: ${this.sd.format}, for data of type (${type}): ${typeof data}`);
            }
            if (this.sd.format == 'json') {
                if (this.sd.preserveRawJsonResponse) {
                    return data == null ? null : (0, types_1.toJson)(data);
                }
                else {
                    let array = type == 'null' ? null : (type == 'object[]' ? data : [data]);
                    let total;
                    return (0, types_1.toJson)(array == null ? { success: true } : { success: true, results: array, total });
                }
            }
            else if (this.sd.format == 'pdf') {
                return data;
            }
            else if (this.sd.format == 'raw') {
                return data;
            }
            else {
                throw Error(`Unsupported format: ${this.sd.format}`);
            }
        }
    }
}
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AServiceContext.prototype, "validate", null);
__decorate([
    (0, decorators_1.override)(AServerContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AServiceContext.prototype, "validateClientVersion", null);
exports.AServiceContext = AServiceContext;
class HttpServiceContext extends AServiceContext {
    constructor(req, res, sd, url, aliasurl, aliasparams) {
        super(sd);
        this._sealed = false;
        this._timedout = false;
        this._completed = false;
        this._request = req;
        this._response = res;
        this._headers = req.headers;
        this._aliasurl = aliasurl;
        this._aliasparams = aliasparams || {};
        this._url = url;
        this._sessionToken = this._headers[Headers.SESSION_TOKEN.toLowerCase() || null];
    }
    validate() {
        if (!this._aliasurl && this._sd.method != 'ANY' && this._sd.method != this.method) {
            throw core_1.GError.METHOD_NOT_ALLOWED();
        }
        super.validate();
    }
    get request() { return this._request; }
    get response() { return this._response; }
    getHeader(h) {
        let hh = this._headers[h.toLowerCase()];
        if (Array.isArray(hh)) {
            return hh[0];
        }
        return hh;
    }
    get method() { return this._request.method; }
    get url() { return this._url; }
    get aliasurl() { return this._aliasurl; }
    get pathname() { return this._url.pathname; }
    get loggablePathname() {
        if (this._loggablePathname != null) {
            return this._loggablePathname;
        }
        this._loggablePathname = this._aliasurl && this._aliasurl.pathname || this._url.pathname;
        if (this._loggablePathname.toLowerCase().startsWith(server_1.Settings.serverRoot)) {
            this._loggablePathname = this._loggablePathname.substr(server_1.Settings.serverRoot.length - 1);
        }
        return this._loggablePathname;
    }
    get queryString() {
        if (this._queryString != null) {
            return this._queryString;
        }
        this._queryString = Url.parse(this._request.url, false).query + '';
        return this._queryString;
    }
    get requestContentType() { return this._request.headers['content-type']; }
    getBody() {
        if (this._body != null) {
            return this._body;
        }
        throw new Error(`Attempt to accesss request body before it has been fully loaded`);
    }
    async _readBody() {
        if (this._body != null) {
            return this._body;
        }
        let body = '';
        await new Promise((resolve, reject) => {
            this._request.on('data', data => {
                body += data;
                if (body.length > comm_1.Settings.maxHttpBodySize) {
                    body = '';
                    this._request.connection.destroy();
                    reject(core_1.GError.PAYLOAD_TOO_LARGE());
                }
            });
            this._request.on('end', resolve);
            this._request.on('error', reject);
        });
        this._body = body;
        return this._body;
    }
    getParams() {
        if (this._params != null) {
            return this._params;
        }
        let params = this._url.query;
        if (this._aliasparams != null) {
            params = { ...params, ...this._aliasparams };
        }
        return params;
    }
    getAllParams() {
        if (this._allparams) {
            return this._allparams;
        }
        return this.getParams();
    }
    async _readParams() {
        let p = this._url.query;
        if (this._aliasparams != null) {
            p = { ...p, ...this._aliasparams };
        }
        if (this.method == 'GET') {
            this._params = this.typifyParams(p);
            this._allparams = p;
        }
        else {
            let body = await this._readBody();
            if (body == null || body.length == 0) {
                this._params = this.typifyParams(p);
                this._allparams = p;
            }
            else if (this.requestContentType == null) {
                throw new Error(`Content-Type' is mandatory for non-GET requests`);
            }
            else if (this.requestContentType.startsWith('application/x-www-form-urlencoded')) {
                p = Object.assign(p, Qs.parse(body));
                this._params = this.typifyParams(p);
                this._allparams = p;
            }
            else if (this.requestContentType.startsWith('application/json')) {
                this._params = Object.assign(this.typifyParams(p), JSON.parse(body));
                this._allparams = Object.assign(p, JSON.parse(body));
            }
            else if (this.requestContentType.startsWith('application/soap+xml') || this.requestContentType.startsWith('text/xml') || this.requestContentType.startsWith('application/xml')) {
                this._params = this.typifyParams(p);
                this._allparams = p;
            }
            else if (this.requestContentType.startsWith('text/plain')) {
                this._params = this.typifyParams(p);
                this._allparams = p;
            }
            else {
                throw new Error(`Unsupported content type '${this.requestContentType}' in '${this.method}' request`);
            }
        }
    }
    async seal() {
        if (this._sealed) {
            return this;
        }
        await this._readBody();
        await this._readParams();
        if (this._sd.timeout) {
            this._request.setTimeout(0);
            this._timer = setTimeout(async () => {
                if (!this._completed) {
                    this._timedout = true;
                    await (0, web_1.webServeError)(core_1.GError.OPERATION_TIMEOUT(), this);
                }
            }, this._sd.timeout).unref();
        }
        this._sealed = true;
        return this;
    }
    format() {
        return this.loggablePathname + this.loggableParams;
    }
    get loggableParams() {
        let params = this._allparams ?? this.getParams();
        return (params && (0, query_1.hasEntries)(params) && JSON.stringify(params) || '') + (this.sd.format == 'soap' && this._body ? 'BODY=' + this._body : '');
    }
    setResponseHeader(name, value) {
        this.response.setHeader(name, value);
    }
    async respond(status, data, compress) {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        if (this._completed) {
            return;
        }
        let res = this._response;
        try {
            res.setHeader('Content-Type', this.sd.contentType);
            if (this.extendedToken) {
                res.setHeader(Headers.SESSION_TOKEN, this.extendedToken);
            }
            if (data == null) {
                this.end(status);
            }
            else if ((0, core_1.isString)(data)) {
                let buf = Buffer.from(data || '', this.sd.getResponseEncoding());
                let acceptEncoding = compress ? (this.getHeader('accept-encoding') || '') : '';
                if (acceptEncoding.match(/\bgzip\b/)) {
                    res.setHeader('Content-Encoding', 'gzip');
                    this.end(status, await _gzip(buf));
                }
                else if (acceptEncoding.match(/\bdeflate\b/)) {
                    res.setHeader('Content-Encoding', 'deflate');
                    this.end(status, await _deflate(buf));
                }
                else {
                    res.setHeader('Content-Length', buf.byteLength);
                    this.end(status, buf);
                }
            }
            else {
                throw core_1.GError.APPLICATION_ERROR(`Unsupported output type: ${typeof data}`);
            }
        }
        catch (e) {
            (0, logger_1.logEx)(e);
            this.end(500);
        }
    }
    redirect(url) {
        if (this._completed) {
            return;
        }
        try {
            this._response.writeHead(302, { 'Location': url });
            this._response.end();
        }
        catch (e) {
            (0, logger_1.logEx)(e);
            try {
                this._response.end();
            }
            catch { }
        }
        this._completed = true;
    }
    async stream(path, contentType) {
        if (this._completed) {
            return;
        }
        if (!Path.isAbsolute(path)) {
            path = Path.resolve(path);
        }
        if (!path.toLowerCase().startsWith(config_1.cfgDeploymentRoot.toLowerCase())) {
            throw new core_1.GError(`Non-rooted path: ${path}`);
        }
        let stat;
        try {
            stat = await _fsstat(path);
        }
        catch (e) {
            throw core_1.GError.NOT_FOUND();
        }
        let context = new BasicServerContext(this.request, this.response);
        let ct = contentType ?? (0, web_1.webGetContentType)(path);
        if (ct != null) {
            context.setResponseHeader('Content-Type', ct);
        }
        let name = Path.basename(path);
        context.setResponseHeader('Content-Disposition', `attachment; filename="${name.replace(/\W/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`);
        let stream = Fs.createReadStream(path);
        this._completed = true;
        await context.respond(200, stream, (0, web_1.webIsCompressible)(stat.size, ct));
    }
    end(status, data) {
        if (this._completed) {
            return;
        }
        try {
            this._response.writeHead(status);
            this._response.end(data);
        }
        catch (e) {
            (0, logger_1.logEx)(e);
            try {
                this._response.end();
            }
            catch { }
        }
        this._completed = true;
    }
    get isTimedout() { return this._timedout; }
    get isCompleted() { return this._completed; }
}
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HttpServiceContext.prototype, "validate", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HttpServiceContext.prototype, "getHeader", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "method", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "url", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "pathname", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "loggablePathname", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "queryString", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "requestContentType", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HttpServiceContext.prototype, "getBody", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HttpServiceContext.prototype, "getParams", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HttpServiceContext.prototype, "seal", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HttpServiceContext.prototype, "format", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "loggableParams", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HttpServiceContext.prototype, "setResponseHeader", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], HttpServiceContext.prototype, "respond", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "isTimedout", null);
__decorate([
    (0, decorators_1.override)(AServiceContext),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], HttpServiceContext.prototype, "isCompleted", null);
exports.HttpServiceContext = HttpServiceContext;
//# sourceMappingURL=context.js.map
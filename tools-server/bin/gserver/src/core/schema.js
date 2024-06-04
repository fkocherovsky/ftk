"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaParseUntypedValue = exports.schemaParseTypedValue = exports.schemaParseParamValue = exports.ParamsDef = exports.ServiceDescriptor = void 0;
const core_1 = require("../../../kit/src/core");
const types_1 = require("../../../kit/src/core/types");
const utils_1 = require("../../../kit/src/core/utils");
const SERVICE_FORMAT_METADATA = {
    'json': { contentType: 'application/json;charset=UTF-8', responseTypes: ['null', 'object', 'object[]'] },
    'soap': { contentType: 'application/soap+xml', responseTypes: ['null', 'xml'] },
    'csv': { contentType: 'text/plain;charset=UTF-8', responseTypes: ['null', 'object', 'object[]'] },
    'pdf': { contentType: 'application/pdf', responseTypes: ['null', 'string'] },
    'raw': { contentType: null, responseTypes: ['null', 'string'] },
    'default': { contentType: 'application/json;charset=UTF-8', responseTypes: ['null'] }
};
class ServiceDescriptor {
    constructor(name, handler) {
        this.bindings = {};
        this.permissions = {};
        this.isInternalService = false;
        this.isSystemService = false;
        this.isTestingService = false;
        this.isExposed = false;
        this.isBinary = false;
        this.name = name;
        this.handler = handler;
        this.schemaParams = null;
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
        if (namelow.startsWith('internal.')) {
            this.isInternalService = true;
        }
        if (namelow.startsWith('services.system.')) {
            this.isSystemService = true;
        }
        if (namelow.startsWith('services.testing.')) {
            this.isTestingService = true;
        }
        this.access = this.isInternalService ? 'internal' : (this.isTestingService || this.isSystemService ? 'unlimited' : 'none');
        this.isExposed = this.isSystemService || this.isInternalService || this.isTestingService ? true : false;
        this.isBinary = this.format == 'pdf' || this.rawResponseEncoding == 'binary';
        if (this.format == 'raw' && (!this.rawContentType || !this.rawResponseEncoding)) {
            throw new core_1.GError(`'raw' service format requires 'rawContentType' and 'rawResponseEncoding' to be explicitly specified in service metadata`);
        }
    }
    get contentType() { return this.rawContentType ?? (SERVICE_FORMAT_METADATA[this.format] || SERVICE_FORMAT_METADATA['default']).contentType; }
    getResponseTypes() { return (SERVICE_FORMAT_METADATA[this.format] || SERVICE_FORMAT_METADATA['default']).responseTypes; }
    getResponseEncoding() { return this.rawResponseEncoding ?? (this.isBinary ? 'binary' : 'utf8'); }
}
exports.ServiceDescriptor = ServiceDescriptor;
class ParamsDef {
    constructor(names, types) {
        this.names = names || [];
        this.types = types || [];
        this._index = {};
        for (let i = 0, len = this.names.length; i < len; i++) {
            this._index[this.names[i]] = i;
        }
    }
    get size() { return this.names.length; }
    set(i, name, type) {
        this.names[i] = name;
        this.types[i] = type;
        this._index[name] = i;
    }
    getType(name) {
        let i = this._index[name];
        return i == null ? null : this.types[i];
    }
    getIndex(name) {
        let i = this._index[name];
        return i == null ? -1 : i;
    }
}
exports.ParamsDef = ParamsDef;
function schemaParseParamValue(sd, name, s) {
    let value = s;
    let type;
    try {
        type = sd.schemaParams && sd.schemaParams.getType(name) || null;
        if (type != null) {
            value = schemaParseTypedValue(type, value);
        }
        else {
            value = schemaParseUntypedValue(value);
        }
    }
    catch (e) {
        throw new core_1.GError(`Failed to convert param '${name}' with value '${s}' to '${type}' in service '${sd.name}'`, e);
    }
    return value;
}
exports.schemaParseParamValue = schemaParseParamValue;
function schemaParseTypedValue(type, o) {
    let value = o;
    if (value === '' && type != 'string') {
        return null;
    }
    switch (type) {
        case 'boolean':
            value = (o === true || o === 'true') ? true : ((o === false || o === 'false') ? false : undefined);
            break;
        case 'number':
            value = (0, core_1.toNumber)(o, undefined);
            break;
        case 'string':
            value = (0, core_1.toString)(value, undefined);
            break;
        case 'object':
            if (utils_1.Utils.isPlainObject(o)) {
                value = o;
            }
            else if ((0, core_1.isString)(o) && o.charAt(0) == '{' && o.charAt(o.length - 1) == '}') {
                value = (0, types_1.fromJson)(o);
            }
            else {
                throw new Error(`Object parse failure: ${o}`);
            }
            break;
        case 'boolean[]':
        case 'number[]':
        case 'string[]':
        case 'object[]':
            if ((0, core_1.isArray)(o)) {
                value = o;
            }
            else if ((0, core_1.isString)(o)) {
                let avalue;
                if (o.charAt(0) == '[' && o.charAt(o.length - 1) == ']') {
                    avalue = (0, types_1.fromJson)(o);
                }
                else {
                    avalue = [o];
                }
                if (type == 'string[]') {
                    value = avalue;
                }
                else if (!(0, core_1.isString)(avalue[0])) {
                    value = avalue;
                }
                else {
                    let atype = type.replace(/\W/g, '');
                    value = avalue.map(x => schemaParseTypedValue(atype, x));
                }
            }
            else {
                throw new Error(`Array parse failure: ${o}`);
            }
            break;
    }
    return value;
}
exports.schemaParseTypedValue = schemaParseTypedValue;
function schemaParseUntypedValue(o) {
    let value = o;
    if ((0, core_1.isString)(o)) {
        if (o.charAt(0) == '[' && o.charAt(o.length - 1) == ']') {
            value = JSON.parse(o);
        }
        else if (o.charAt(0) == '{' && o.charAt(o.length - 1) == '}') {
            value = JSON.parse(o);
        }
    }
    return value;
}
exports.schemaParseUntypedValue = schemaParseUntypedValue;
//# sourceMappingURL=schema.js.map
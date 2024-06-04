"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webServeData = exports.webServeError = exports.webGetContentType = exports.webIsCompressible = exports.Settings = void 0;
const Path = require("path");
const core_1 = require("../../../kit/src/core");
const config_1 = require("./config");
const logger_1 = require("./logger");
let Settings = class Settings {
};
Settings.contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.xml': 'application/xhtml+xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip'
};
Settings = __decorate([
    (0, config_1.configurable)()
], Settings);
exports.Settings = Settings;
function webIsCompressible(size, contentType) {
    return (size == null || size > MIN_COMPRESSABLE_SIZE) && (!contentType?.startsWith('image') || contentType == 'image/svg-xml') && (contentType != 'application/zip');
}
exports.webIsCompressible = webIsCompressible;
const MIN_COMPRESSABLE_SIZE = 1024;
function webGetContentType(file) {
    if (!file) {
        return null;
    }
    return Settings.contentTypes[Path.extname(file).toLowerCase()] || null;
}
exports.webGetContentType = webGetContentType;
async function webServeError(error, context, log = true) {
    try {
        let { code, httpStatus, message } = (error instanceof core_1.GError) ? error : core_1.GError.GENERAL_ERROR();
        if (log) {
            let timeout = context.isTimedout && !(error && error instanceof core_1.GError && error.code == core_1.GError.OPERATION_TIMEOUT().code);
            (0, logger_1.logTraffic)(timeout ? 'OUT(err)(timedout)' : 'OUT(err)', context, `${code} ${message}. REQUEST: ${context.format()}`);
        }
        await context.respond(httpStatus);
    }
    catch (e) {
        (0, core_1.logEx)(e);
        try {
            await context.respond(500);
        }
        catch { }
    }
}
exports.webServeError = webServeError;
async function webServeData(data, error, context) {
    if (data == null && error != null) {
        return webServeError(error, context);
    }
    let timeout = context.isTimedout && !(error && error instanceof core_1.GError && error.code == core_1.GError.OPERATION_TIMEOUT().code);
    if (error != null) {
        (0, logger_1.logTraffic)(timeout ? 'OUT(err)(timedout)' : 'OUT(err)', context, `${context.sd.isBinary ? '(binary)' : data}. REQUEST: ${context.format()}`);
    }
    else {
        (0, logger_1.logTraffic)(timeout ? 'OUT(timedout)' : 'OUT', context, context.sd.isBinary ? '(binary)' : data);
    }
    let compress = data && data.length > MIN_COMPRESSABLE_SIZE;
    let status = error == null ? 200 : (error instanceof core_1.GError ? error.httpStatus : 500);
    await context.respond(status, data, compress);
}
exports.webServeData = webServeData;
//# sourceMappingURL=web.js.map
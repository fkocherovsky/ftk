"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeServer = exports.Settings = exports.serverServices = exports.inDevelopment = void 0;
const Http = require("http");
const Url = require("url");
const core_1 = require("../../../kit/src/core");
const config_1 = require("./config");
const loader_1 = require("./loader");
const schema_1 = require("./schema");
const context_1 = require("./context");
const logger_1 = require("./logger");
const reflect_1 = require("../../../kit/src/core/reflect");
const web_1 = require("./web");
exports.inDevelopment = false;
exports.serverServices = {};
let Settings = class Settings {
};
Settings.serverRoot = '/gmlserver/';
Settings = __decorate([
    (0, config_1.configurable)()
], Settings);
exports.Settings = Settings;
async function initializeServer() {
    try {
        await (0, config_1.cfgInitialize)();
        await (0, loader_1.loaderScanModules)();
        await _loadServices();
        await (0, config_1.cfgApply)();
        let server = Http.createServer({ keepAlive: true }, async (req, res) => {
            await _handleHttpRequest(req, res);
        });
        server.timeout = 30000;
        server.keepAliveTimeout = 1800000;
        server.listen(80);
    }
    catch (e) {
        (0, core_1.logEx)(e);
    }
}
exports.initializeServer = initializeServer;
let tmpServerRoot = '/tools-server/';
async function _handleHttpRequest(req, res) {
    let context;
    try {
        let serverRoot = Settings.serverRoot;
        let url = Url.parse(req.url, true);
        let pathlow = url.pathname.toLowerCase();
        pathlow = pathlow.substr(tmpServerRoot.length).replace(/\.[^.]*$/, '');
        let sd = exports.serverServices[pathlow];
        if (sd == null) {
            throw core_1.GError.NOT_FOUND();
        }
        if (!sd.isExposed) {
            throw core_1.GError.NOT_FOUND(`not exposed by schema, or not whitelisted${sd.authorization == 'none' ? `(note that authorization = 'none' services require whitelisting by full name, not by namespace.*)` : ''}`);
        }
        if (sd.protocol == 'http-upload' || sd.protocol == 'http-download') {
            throw core_1.GError.NOT_SUPPORTED(`${sd.protocol} isnot supported yet`);
        }
        else {
            context = _createContext(context_1.HttpServiceContext, req, res, sd, url, null, null);
        }
        context.validate();
        await context.seal();
        await _handleService(context);
    }
    catch (e) {
        (0, logger_1.logFailure)(e, context, 'failed to handle request');
    }
}
async function _handleService(context) {
    try {
        (0, logger_1.logTraffic)('IN', context);
        let exception;
        let result;
        try {
            let params = context.getParams();
            await _validateServicePermissions(context, params);
            let value = await Reflect.apply(context.sd.handler, null, [params, context]);
            if (value === false) {
                throw core_1.GError.APPLICATION_ERROR();
            }
            result = (value === true || value === null || value === undefined) ? null : value;
        }
        catch (e) {
            exception = e;
            (0, logger_1.logFailure)(e, context);
        }
        let data = context.formatResponse(result, exception);
        await (0, web_1.webServeData)(data, exception, context);
    }
    catch (e) {
        (0, core_1.logEx)(e, `failed to handle service ${context.loggablePathname}`);
    }
}
async function _validateServicePermissions(context, input) {
}
function _loadServices() {
    for (let [name, handler] of Object.entries(loader_1.loaderServiceHandlers)) {
        let key = name.replace(/\./g, '/').toLowerCase();
        exports.serverServices[key] = new schema_1.ServiceDescriptor(name, handler);
    }
}
function _createContext(type, ...args) {
    return (0, reflect_1.instantiate)(loader_1.loaderContextClasses.get(type), ...args);
}
//# sourceMappingURL=server.js.map
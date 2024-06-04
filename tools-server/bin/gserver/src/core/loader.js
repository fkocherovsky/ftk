"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loaderScanModules = exports.loaderContextClasses = exports.loaderServiceHandlers = void 0;
const Fsp = require("fs/promises");
const Path = require("path");
const config_1 = require("./config");
const core_1 = require("../../../kit/src/core");
const reflect_1 = require("../../../kit/src/core/reflect");
const context_1 = require("./context");
exports.loaderServiceHandlers = {};
exports.loaderContextClasses = new Map();
async function loaderScanModules(path) {
    if (path == null) {
        exports.loaderContextClasses.set(context_1.HttpServiceContext, context_1.HttpServiceContext);
        for (let fname of (await Fsp.readdir(config_1.cfgServerBinRoot))) {
            let fpath = Path.resolve(config_1.cfgServerBinRoot, fname);
            if ((await Fsp.stat(fpath)).isDirectory()) {
                await loaderScanModules(fpath);
            }
        }
        return;
    }
    let coreServerRoot = Path.resolve(config_1.configCoreSrcRoot, '..');
    for (let fname of (await Fsp.readdir(path))) {
        let fpath = Path.resolve(path, fname).replace(/\\/g, "/");
        if ((await Fsp.stat(fpath)).isDirectory()) {
            await loaderScanModules(fpath);
            continue;
        }
        if (!fname.match(/\.js$/i)) {
            continue;
        }
        let mod;
        try {
            mod = require(fpath);
        }
        catch (e) {
            (0, core_1.logE)(`Failed to load module: ${fpath}, [${e}]`);
            continue;
        }
        _modules[fpath] = mod;
        let relativePatStartPos = fpath.indexOf('/services/');
        for (let [name, o] of Object.entries(mod)) {
            if (!(0, reflect_1.isFunction)(o) && !(0, reflect_1.isClass)(o)) {
                continue;
            }
            if ((0, reflect_1.isClass)(o)) {
                let cmd = (0, config_1.cfgGetMetadata)(o) || null;
                if (cmd != null) {
                    (0, config_1.cfgLoadMetadata)(fpath, mod, o, cmd);
                    continue;
                }
                if (!coreServerRoot) {
                    if ((0, reflect_1.isSubClass)(o, context_1.HttpServiceContext)) {
                        exports.loaderContextClasses.set(context_1.HttpServiceContext, o);
                    }
                }
            }
            if ((0, reflect_1.isFunction)(o)) {
                let isService = relativePatStartPos >= 0;
                if (isService) {
                    let servicePath = fpath.substr(relativePatStartPos + 1);
                    let sName = `${servicePath.replace(/\/|\\/g, '.').replace(/\.js$/i, '')}.${name}`;
                    if (exports.loaderServiceHandlers[sName] != undefined) {
                        (0, core_1.logE)(`Service ${sName} is already loaded}`);
                        throw new core_1.GError(`Duplicate service implementations of '${sName}'`);
                    }
                    exports.loaderServiceHandlers[sName] = o;
                }
            }
        }
    }
}
exports.loaderScanModules = loaderScanModules;
let _modules = {};
//# sourceMappingURL=loader.js.map
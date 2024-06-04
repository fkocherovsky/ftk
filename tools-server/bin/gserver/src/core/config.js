"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfgLoadMetadata = exports.cfgGetStartupFlags = exports.cfgApply = exports.cfgInitialize = exports.StartupFlags = exports.configCoreSrcRoot = exports.cfgAppSrcRoot = exports.cfgServerBinRoot = exports.cfgAppEtcRoot = exports.cfgCoreEtcRoot = exports.cfgDeploymentRoot = exports.G_SERVER_FOLDER_NAME = exports.cfgGetMetadata = exports.configurable = exports.ConfigMetadata = void 0;
const Fsp = require("fs/promises");
const core_1 = require("../../../kit/src/core");
const Path = require("path");
const bootstrap_1 = require("./bootstrap");
const schema_1 = require("./schema");
require("reflect-metadata");
class ConfigMetadata {
}
exports.ConfigMetadata = ConfigMetadata;
let _configMetadataKey = Symbol('ConfigMetadata');
function configurable(metadata) {
    if (!metadata) {
        metadata = new ConfigMetadata();
    }
    return Reflect.metadata(_configMetadataKey, metadata);
}
exports.configurable = configurable;
function cfgGetMetadata(o, property) {
    return Reflect.getMetadata(_configMetadataKey, o, property);
}
exports.cfgGetMetadata = cfgGetMetadata;
exports.G_SERVER_FOLDER_NAME = 'gserver';
class StartupFlags {
}
exports.StartupFlags = StartupFlags;
async function cfgInitialize() {
    let coreConfigJsPath = module.filename;
    exports.cfgDeploymentRoot = Path.resolve(coreConfigJsPath, '../../../../../../');
    let serverRoot = Path.resolve(coreConfigJsPath, '../../../../../');
    exports.cfgServerBinRoot = Path.resolve(coreConfigJsPath, '../../../../');
    let bootstrapJsPath = require.main.filename;
    exports.cfgAppSrcRoot = Path.dirname(bootstrapJsPath);
    exports.configCoreSrcRoot = Path.resolve(coreConfigJsPath, './../../');
    exports.cfgCoreEtcRoot = Path.join(exports.cfgDeploymentRoot, exports.G_SERVER_FOLDER_NAME, 'etc');
    exports.cfgAppEtcRoot = Path.join(serverRoot, 'etc');
}
exports.cfgInitialize = cfgInitialize;
async function cfgApply() {
    let sFlags = cfgGetStartupFlags();
    let fileConfig = new Map();
    let defaultConfigFile = Path.join(exports.cfgAppEtcRoot, 'settings', `${bootstrap_1.appName}.properties`);
    let envConfigFile = Path.join(exports.cfgAppEtcRoot, 'settings', `${bootstrap_1.appName}.(${sFlags.env}).properties`);
    fileConfig = await _loadProperties(defaultConfigFile);
    fileConfig = new Map([...fileConfig, ...(await _loadProperties(envConfigFile))]);
    for (let [key, value] of fileConfig.entries()) {
        let values = key.split(/[\[\]]/);
        if (values.length >= 2) {
            try {
                fileConfig.delete(key);
                key = values[0];
                let otherkey = values[1].trim();
                let othervalue = otherkey.startsWith('@') ? fileConfig.get(otherkey.substring(1)) : otherkey;
                if (!othervalue) {
                    (0, core_1.logE)(`Referenced key '${key}[${otherkey}]' value is empty, config entry skipped`);
                    continue;
                }
                let o = fileConfig.get(key);
                if (!o) {
                    fileConfig.set(key, {});
                }
                else if ((0, core_1.isString)(o)) {
                    fileConfig.set(key, {});
                }
                let map = fileConfig.get(key);
                if (map[othervalue] !== undefined) {
                    throw "new GError(`Duplicate map value for key ${othervalue}`)";
                }
                map[othervalue] = value;
                (0, core_1.logI)(`${othervalue} : ${value}`);
            }
            catch (e) {
                throw "new GError(`Invalid map property value: ${key}`, e)";
            }
        }
    }
    for (let [key, cd] of Object.entries(_configuration)) {
        if (!cd.configMetadata.encrypted && (cd.dataType == 'string' || cd.dataType == 'string[]') && (/.*(password|appkey|apikey|secret).*/i.test(key))) {
            throw new core_1.GError(`${key}: secrets must be marked as encrypted = true`);
        }
        let value = fileConfig.get(key);
        if (value === undefined) {
            continue;
        }
        fileConfig.delete(key);
        value = (0, schema_1.schemaParseTypedValue)(cd.dataType, value);
        cd.value = value;
        if (cd.configMetadata.encrypted) {
            value = _decrypt(value);
        }
        Reflect.set(cd.configObject, cd.configProperty, value);
    }
    (0, core_1.logI)('config applied');
}
exports.cfgApply = cfgApply;
function _decrypt(str) {
    return `DummyDecrypted_${str}`;
}
function cfgGetStartupFlags() {
    let args = process.argv.slice(2);
    let flags = new StartupFlags();
    for (let i = 0, len = args.length; i < len; i += 2) {
        let value = args[i + 1];
        flags[args[i].replace(/^-+/, '')] = (value.match(/^[0-9]+$/) || value.match(/^true|false$/)) ? JSON.parse(value) : value;
    }
    return flags;
}
exports.cfgGetStartupFlags = cfgGetStartupFlags;
function cfgLoadMetadata(fpath, configModule, configObject, configMetadata) {
    if (configMetadata.notify || configMetadata.encrypted || configMetadata.dataType) {
        throw "new GError(`'notify', 'encrypted', 'dataType' config metadata values can only be set on properties`)";
    }
    let relativePath = fpath.substr(exports.cfgAppSrcRoot.length + 1);
    let configObjectPath = relativePath.replace(/\/|\\/g, '.').replace(/\.js$/i, '');
    for (let [pname, pvalue] of Object.entries(configObject)) {
        let pmd = cfgGetMetadata(configObject, pname) || new ConfigMetadata();
        let configPath = `${configObjectPath}.${pname}`;
        let cd = {
            configPath: configPath,
            configObject: configObject,
            configModule: configModule,
            configProperty: pname,
            configMetadata: pmd,
            configOnly: pmd.configOnly,
            defaultValue: pvalue,
            dataType: pmd.dataType || _getConfigDataType(pvalue),
            value: pvalue,
            updatedOn: null
        };
        _configuration[configPath] = cd;
    }
}
exports.cfgLoadMetadata = cfgLoadMetadata;
async function _loadProperties(path) {
    if (path == null) {
        return null;
    }
    let props = new Map();
    let file = await Fsp.readFile(path, 'utf8');
    let lines = file.split(/[\r\n]+/);
    for (let s of lines) {
        s = s.trim();
        if (s.length == 0 || s.charAt(0) == '#') {
            continue;
        }
        let i = s.indexOf('=');
        if (i <= 0) {
            continue;
        }
        let key = s.substring(0, i).trim();
        let value = null;
        s = s.substring(i + 1).trim();
        if (s.charAt(0) == '{' && s.charAt(s.length - 1) == '}') {
            value = JSON.parse(s);
        }
        else if (s.charAt(0) == '[' && s.charAt(s.length - 1) == ']') {
            value = JSON.parse(s);
        }
        else {
            value = s.replace(/(^")|("$)/g, '');
        }
        if (props.has(key)) {
            (0, core_1.logE)(`Duplicate key ${key} in file: ${path}`);
        }
        props.set(key, value);
    }
    return props;
}
function _getConfigDataType(value, ignoreArrays) {
    if (value == null) {
        return 'object';
    }
    else if ((0, core_1.isString)(value)) {
        return 'string';
    }
    else if ((0, core_1.isBoolean)(value)) {
        return 'boolean';
    }
    else if ((0, core_1.isNumber)(value)) {
        return 'number';
    }
    else if (!ignoreArrays && (0, core_1.isArray)(value)) {
        return _getConfigDataType(value[0], true) + '[]';
    }
    else {
        return 'object';
    }
}
let _configuration = {};
//# sourceMappingURL=config.js.map
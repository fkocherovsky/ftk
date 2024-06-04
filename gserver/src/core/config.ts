// import * as Fs from 'fs';
import * as Fsp from 'fs/promises';
// import * as Inspector from 'inspector';
import { Index, isString, isArray, GError, isBoolean, isNumber, logE, logI, Gmap } from '../../../kit/src/core';
// import * as Os from 'os';
import * as Path from 'path';

import { appName } from './bootstrap';
import { ServiceParamTypeName, schemaParseTypedValue } from './schema';

import 'reflect-metadata';


export class ConfigMetadata {
    description?: string;
    encrypted?: boolean;
    notify?: boolean;
    dataType?: ServiceParamTypeName;
    configOnly?: boolean; // a flag saying if a property is only set by config file, and can't be updated from DB
}
let _configMetadataKey = Symbol('ConfigMetadata');
 
export function configurable(metadata?: ConfigMetadata) {
    if (!metadata) { metadata = new ConfigMetadata(); }
    return Reflect.metadata(_configMetadataKey, metadata);
}

export function cfgGetMetadata(o: any, property?: string) {
    return Reflect.getMetadata(_configMetadataKey, o, property) as ConfigMetadata;
}


export const G_SERVER_FOLDER_NAME = 'gserver';

export let cfgDeploymentRoot: string   // <deployment-root>
export let cfgCoreEtcRoot: string;     // <deployment-root>/gserver/etc (local)
export let cfgAppEtcRoot: string;      // <deployment-root>/<app-server>/etc
export let cfgServerBinRoot: string;
export let cfgAppSrcRoot: string;
export let configCoreSrcRoot: string;  // <deployment-root>/<app-server>/bin/gserver/src

export class StartupFlags {
    app: string;
    env: string;
    [key: string]: string | number | boolean;
}
 

export async function cfgInitialize() {
    let coreConfigJsPath = module.filename;
    cfgDeploymentRoot = Path.resolve(coreConfigJsPath, '../../../../../../');
    let serverRoot = Path.resolve(coreConfigJsPath, '../../../../../');
    cfgServerBinRoot = Path.resolve(coreConfigJsPath, '../../../../');
    let bootstrapJsPath = require.main.filename;
    cfgAppSrcRoot = Path.dirname(bootstrapJsPath); 
    configCoreSrcRoot    = Path.resolve(coreConfigJsPath, './../../');             // [<deployment-root>/<server-root>/bin/gserver/src] /core/config.js 

    cfgCoreEtcRoot = Path.join(cfgDeploymentRoot, G_SERVER_FOLDER_NAME, 'etc');
    cfgAppEtcRoot = Path.join(serverRoot, 'etc');

}

export async function cfgApply() {
    let sFlags = cfgGetStartupFlags();
    let fileConfig: Map<string, any> = new Map();
    let defaultConfigFile = Path.join(cfgAppEtcRoot, 'settings', `${appName}.properties`);
    let envConfigFile = Path.join(cfgAppEtcRoot, 'settings', `${appName}.(${sFlags.env}).properties`);
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
              if (!othervalue) { logE(`Referenced key '${key}[${otherkey}]' value is empty, config entry skipped`); continue; }
  
              let o = fileConfig.get(key);
              if (!o) {
                 fileConfig.set(key, {});
              } else if (isString(o)) {
                 fileConfig.set(key, {}); // this handles the case when entire map is defined in config property (i.e. when "key = { xxx }" is used instead of "key[xxx]")
              }
              let map = fileConfig.get(key) as Gmap;
              if (map[othervalue] !== undefined) { throw "new GError(`Duplicate map value for key ${othervalue}`)"; }
              map[othervalue] = value;
              logI(`${othervalue} : ${value}`);
            } catch (e) {
              throw "new GError(`Invalid map property value: ${key}`, e)";
            }
        }
    }

    for (let [key, cd] of Object.entries(_configuration)) {
        if (!cd.configMetadata.encrypted && (cd.dataType == 'string' || cd.dataType == 'string[]') && (/.*(password|appkey|apikey|secret).*/i.test(key))) {
            throw new GError(`${key}: secrets must be marked as encrypted = true`);
        }
        let value = fileConfig.get(key);
        if (value === undefined) { continue; }

        fileConfig.delete(key);
        value = schemaParseTypedValue(cd.dataType, value);
        // TODO: add proper value parsing
        cd.value = value;
        // TODO: handle encrypted config
        // if (cd.configMetadata.encrypted) { value = cryptoIsInitialized ? _decrypt(value) : value; }
        if (cd.configMetadata.encrypted) { 
            value = _decrypt(value);
        }
        Reflect.set(cd.configObject, cd.configProperty, value);
    }
    logI('config applied');
}

function _decrypt(str: string) {
    return `DummyDecrypted_${str}`;
 }
 

export function cfgGetStartupFlags(): StartupFlags {
    let args = process.argv.slice(2);
    let flags: StartupFlags = new StartupFlags();
    for (let i = 0, len = args.length; i < len; i += 2) {
       let value = args[i + 1];
       flags[args[i].replace(/^-+/, '')] = (value.match(/^[0-9]+$/) || value.match(/^true|false$/)) ? JSON.parse(value) : value;
    }
    return flags;
}

export function cfgLoadMetadata(fpath: string, configModule: any, configObject: any, configMetadata: ConfigMetadata) {
    if (configMetadata.notify || configMetadata.encrypted || configMetadata.dataType) { throw "new GError(`'notify', 'encrypted', 'dataType' config metadata values can only be set on properties`)"; }
 
    let relativePath = fpath.substr(cfgAppSrcRoot.length + 1);
    let configObjectPath = relativePath.replace(/\/|\\/g, '.').replace(/\.js$/i, '');
    for (let [pname, pvalue] of Object.entries(configObject)) {
       let pmd = cfgGetMetadata(configObject, pname) || new ConfigMetadata();
       let configPath = `${configObjectPath}.${pname}`;
       // let configReloader = configModule['onConfigReloaded'] as StartupFunction;
       // let configAppnames = configReloader?.metadata.appnames;
       // if (configReloader && configAppnames && configAppnames != '*' && !configAppnames.includes(appName)) { configReloader = null; }
       let cd: ConfigDescriptor = {
          configPath: configPath,
          configObject: configObject,
          configModule: configModule,
          configProperty: pname,
          configMetadata: pmd,
          // configReloader: pmd.notify ? configReloader : null,
          configOnly: pmd.configOnly,
          defaultValue: pvalue,
          dataType: pmd.dataType || _getConfigDataType(pvalue),
          value: pvalue,
          updatedOn: null // DateTime.now().toISO()
       };
       _configuration[configPath] = cd;
    }
}


/***************************************/
async function _loadProperties(path: string) {
    if (path == null) { return null; }
 
    let props: Map<string, any> = new Map();
    let file = await Fsp.readFile(path, 'utf8');
    let lines = file.split(/[\r\n]+/);
    for (let s of lines) {
       s = s.trim();
       if (s.length == 0 || s.charAt(0) == '#') { continue; }
 
       let i = s.indexOf('=');
       if (i <= 0) { continue; }
 
       // remove all spaces around the key (e.g. key can be Gmap in which [] brackets are vertically aligned using spaces)
       let key = s.substring(0, i).trim();
 
       // we guess JSON/array values (99% of usages) - if anyone wants to keep string - use quotes
       let value = null;
       s = s.substring(i + 1).trim();
       if (s.charAt(0) == '{' && s.charAt(s.length - 1) == '}') {
          value = JSON.parse(s);
       } else if (s.charAt(0) == '[' && s.charAt(s.length - 1) == ']') {
          value = JSON.parse(s);
       } else {
          value = s.replace(/(^")|("$)/g, '');
       }
 
       if (props.has(key)) { logE(`Duplicate key ${key} in file: ${path}`); }
       props.set(key, value);
    }
    return props;
}

interface ConfigDescriptor {
    configPath: string;
    configObject: object;
    configModule: object;
    configProperty: string;
    configMetadata: ConfigMetadata;
    // configReloader?: StartupFunction; // async function on configModule which is called when this property is changed
    configOnly?: boolean;
    defaultValue: any;
    dataType: ServiceParamTypeName;
    value: any;
    updatedOn: string;
 }
 



function _getConfigDataType(value: any, ignoreArrays?: boolean): ServiceParamTypeName {
    if (value == null) {
       return 'object';
    } else if (isString(value)) {
       return 'string';
    } else if (isBoolean(value)) {
       return 'boolean';
    } else if (isNumber(value)) {
       return 'number';
    } else if (!ignoreArrays && isArray(value)) {
       return _getConfigDataType(value[0], true) + '[]' as ServiceParamTypeName; // for arrays - drill-down take first item's type, but don't go deeper than 1st level (deeper-then-top-level config values are always JSON objects)
    } else {
       return 'object';
    }
 }
 
 
let _configuration: Index<ConfigDescriptor> = {}; 
 
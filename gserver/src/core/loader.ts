import * as Fsp from 'fs/promises';
import * as Path from 'path';

import { cfgServerBinRoot, cfgGetMetadata, cfgLoadMetadata, configCoreSrcRoot } from './config';
import { ServiceHandler } from './schema';

import { logE, Index, logI, GError } from '../../../kit/src/core';
import { isClass, isFunction, isSubClass } from '../../../kit/src/core/reflect';
import { AServiceContext, BasicServerContext, HttpServiceContext } from './context';

export let loaderServiceHandlers: Index<ServiceHandler> = {};
export let loaderContextClasses: Map<ConstructorOf<AServiceContext>, ConstructorOf<AServiceContext>> = new Map();

export async function loaderScanModules(path?: string) {
    if (path == null) {
        loaderContextClasses.set(HttpServiceContext, HttpServiceContext);
        for (let fname of (await Fsp.readdir(cfgServerBinRoot))) {
            let fpath = Path.resolve(cfgServerBinRoot, fname);
            if ((await Fsp.stat(fpath)).isDirectory()) {
                await loaderScanModules(fpath);
            }
        }
        return;
    }


    let coreServerRoot = Path.resolve(configCoreSrcRoot, '..');

    for (let fname of (await Fsp.readdir(path))) {
        let fpath = Path.resolve(path, fname).replace(/\\/g, "/");
        if ((await Fsp.stat(fpath)).isDirectory()) {
            await loaderScanModules(fpath);
            continue;
        }
        if (!fname.match(/\.js$/i)) { continue; }
        let mod: any;
        try {
            mod = require(fpath);
        } catch (e) {
            logE(`Failed to load module: ${fpath}, [${e}]`);
            continue;
        }

        _modules[fpath] = mod;
        let relativePatStartPos = fpath.indexOf('/services/');
        for (let [name, o] of Object.entries(mod)) {
            if (!isFunction(o) && !isClass(o)) { continue; }
            if (isClass(o)) {
                let cmd = cfgGetMetadata(o) || null;
                if (cmd != null) {
                    cfgLoadMetadata(fpath, mod, o, cmd);
                    continue;
                }
                if (!coreServerRoot) {
                    if (isSubClass(o, HttpServiceContext)) { loaderContextClasses.set(HttpServiceContext, o as ConstructorOf<HttpServiceContext>); }
                }
            }
            if (isFunction(o)) {
                let isService = relativePatStartPos >= 0;
                if (isService) {
                    // if (name.startsWith('_')) { continue; } // skip private functions
                    let servicePath = fpath.substr(relativePatStartPos + 1);
                    let sName = `${ servicePath.replace(/\/|\\/g, '.').replace(/\.js$/i, '') }.${ name }`;
                    if (loaderServiceHandlers[sName] != undefined) { 
                        logE(`Service ${sName} is already loaded}`);
                        throw new GError(`Duplicate service implementations of '${sName}'`);
                    }
                    loaderServiceHandlers[sName] = o as ServiceHandler;
                }
            }
        }

    }
  
}


/**************************************/
let _modules: Index<any> = {};
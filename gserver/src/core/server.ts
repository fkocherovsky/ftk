import * as Http from 'http';
import * as Url from 'url';

import { GError, Gvalue, Index, logEx } from '../../../kit/src/core';

import { cfgApply, cfgInitialize, configurable } from './config';
import { loaderContextClasses, loaderScanModules, loaderServiceHandlers } from './loader';
import { ServiceDescriptor, ServiceResponseType } from './schema';
import { BasicServerContext, AServiceContext, HttpServiceContext } from './context';
import { logFailure, logTraffic } from './logger';
import { instantiate } from '../../../kit/src/core/reflect';
import { Garray, Gmap } from '../../../kit/src/core/types';
import { webServeData } from './web';

// import { Index, isString, isArray, isBoolean, isNumber, logE, logI, Gmap } from '../../../kit/src/core';

export let inDevelopment = false;
export let serverServices: Index<ServiceDescriptor> = {}; // keys are a lowercase path just after Settings.serverRoot (e.g. internal/testing/servicename, or services/testing/servicename)

@configurable()
export class Settings {
   static serverRoot = '/gmlserver/';
}


export async function initializeServer() {
    try {
        await cfgInitialize();
        await loaderScanModules();
        await _loadServices();
        await cfgApply();
        let server = Http.createServer({ keepAlive: true }, async (req, res) => {
            await _handleHttpRequest(req, res);
        });
        server.timeout = 30000; //WebSettings.defaultRequestTimeout;
        server.keepAliveTimeout = 1800000; //WebSettings.inboundKeepAliveTimeout; // default must be overriden and set to more than what's set in inbound router/reverse-proxy
        server.listen(80/*Settings.port*/);
    } catch (e) {
        logEx(e);
    }

}

let tmpServerRoot = '/tools-server/'; // TODO: replace by Settings.serverRoot
async function _handleHttpRequest(req: Http.IncomingMessage, res: Http.ServerResponse) {
    let context: HttpServiceContext;
    try {
        let serverRoot = Settings.serverRoot;
        let url = Url.parse(req.url, true);
        let pathlow = url.pathname.toLowerCase();
        //    TODO: 
        // // handle non-service (web file) requests
        // if (!pathlow.startsWith(serverRoot)) { return await webServeFile(new BasicHttpContext(req, res)); }

        // TODO: meanwhile alias == url. to implement real alias mechanism
        // let aliasurl: Url.UrlWithParsedQuery = url;

        pathlow = pathlow.substr(tmpServerRoot.length).replace(/\.[^.]*$/, ''); // remove extension from path, if any
        let sd: any = serverServices[pathlow];
        if (sd == null) { throw GError.NOT_FOUND(); }
        if (!sd.isExposed) { throw GError.NOT_FOUND(`not exposed by schema, or not whitelisted${sd.authorization == 'none' ? `(note that authorization = 'none' services require whitelisting by full name, not by namespace.*)` : ''}`); }
    
        if (sd.protocol == 'http-upload' || sd.protocol == 'http-download') {
            throw GError.NOT_SUPPORTED(`${sd.protocol} isnot supported yet`);
        } else {
            //constructor(req: Http.IncomingMessage, res: Http.ServerResponse, sd: ServiceDescriptor, url: Url.UrlWithParsedQuery, aliasurl?: Url.UrlWithParsedQuery, aliasparams?: Qs.ParsedUrlQuery) {
            context = _createContext(HttpServiceContext, req, res, sd, url, /*aliasurl*/ null, /*aliasdata.aliasparams*/ null);
        }

        context.validate();
        await context.seal();
        await _handleService(context);
    } catch (e) {
        // TODO: detailed exception handling 
        logFailure(e, context, 'failed to handle request');
    }
}

async function _handleService(context: AServiceContext) {
    try {
        logTraffic('IN', context);
        let exception: Error;
        let result: ServiceResponseType;
        try {
            let params = context.getParams();
            await _validateServicePermissions(context, params);
            let value = await Reflect.apply(context.sd.handler, null, [params, context]) as Garray | Gmap | boolean; // TODO: add Gxml after the type implementing
            if (value === false) { throw GError.APPLICATION_ERROR(); } // service returning false wants to respond with generic applicative error
            result = (value === true || value === null || value === undefined) ? null : value as ServiceResponseType;
        } catch (e) {
            exception = e;
            logFailure(e, context);
        }

        let data = context.formatResponse(result, exception);
        await webServeData(data, exception, context);
    } catch (e) {
        // TODO: detailed exception handling 
        // logFailure(e, context, 'failed to handle request');
        logEx(e, `failed to handle service ${context.loggablePathname}`);
    }
}

async function _validateServicePermissions(context: AServiceContext, input: Index<Gvalue>) {
    // TODO: to implement
}

function _loadServices() {
    for (let [name, handler] of Object.entries(loaderServiceHandlers)) {
       let key = name.replace(/\./g, '/').toLowerCase();
       serverServices[key] = new ServiceDescriptor(name, handler);
     }
 }

 function _createContext<T extends AServiceContext>(type: ConstructorOf<T>, ...args: any[]): T {
    return instantiate(loaderContextClasses.get(type) as ConstructorOf<T>, ...args);
 }
 
 
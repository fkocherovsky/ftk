// tslint:enable:naming-convention
import * as Http from 'http';

// import { logE, logI } from 'kit/core';
import { logE, logI } from '../../../kit/src/core';
import { cfgGetStartupFlags, cfgInitialize } from './config';
import { loaderScanModules } from './loader';
import { initializeServer } from './server';

export let appName: string;

// tslint:disable:no-console
export async function bootstrapServer() {
   let flags = cfgGetStartupFlags();
   appName = flags.app;
   logI(`${process.pid}: Starting server (single-process): ` + JSON.stringify(flags));
   await initializeServer();
}
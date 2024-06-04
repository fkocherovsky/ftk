import * as Path from 'path';

import { GError, Index, logEx } from '../../../kit/src/core';

import { configurable } from './config';
import { AServerContext, AServiceContext } from './context';
import { logTraffic } from './logger';

@configurable()
export class Settings {
    static contentTypes: Index<string> = {
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
}

export function webIsCompressible(size?: number, contentType?: string) {
    return (size == null || size > MIN_COMPRESSABLE_SIZE) && (!contentType?.startsWith('image') || contentType == 'image/svg-xml') && (contentType != 'application/zip');
}
 
 const MIN_COMPRESSABLE_SIZE = 1024; // don't compress if it fits 1 packet (1 packet is ~1400 bytes, but there's also header, so 1K seems to be just about right)
 
export function webGetContentType(file: string) {
    if (!file) { return null; }
    return Settings.contentTypes[Path.extname(file).toLowerCase()] || null;
}

// this method is used to respond in case of unexpected errors (therefore only status code is returned, no payload, because payload is unknown and cannot be correctly serialized)
export async function webServeError(error: Error, context: AServerContext, log = true) {
   try {
      let { code, httpStatus, message } = (error instanceof GError) ? error : GError.GENERAL_ERROR();
      if (log) {
         // timed-out handling is valuable to see when the actual response was supposed to be sent, and having what content
         let timeout = context.isTimedout && !(error && error instanceof GError && error.code == GError.OPERATION_TIMEOUT().code);
         logTraffic(timeout ? 'OUT(err)(timedout)' : 'OUT(err)', context, `${code} ${message}. REQUEST: ${context.format()}`);
      }

      await context.respond(httpStatus);
   } catch (e) {
      logEx(e); // can't really happen
      try { await context.respond(500); } catch {}
   }
}

export async function webServeData(data: string, error: Error, context: AServiceContext) {
   if (data == null && error != null) {
      return webServeError(error, context);
   }

   // timed-out handling is valuable to see when the actual response was supposed to be sent, and having what content
   let timeout = context.isTimedout && !(error && error instanceof GError && error.code == GError.OPERATION_TIMEOUT().code);
   if (error != null) {
      logTraffic(timeout ? 'OUT(err)(timedout)' : 'OUT(err)', context,  `${context.sd.isBinary ? '(binary)' : data}. REQUEST: ${context.format()}`);
   } else {
      logTraffic(timeout ? 'OUT(timedout)' : 'OUT', context, context.sd.isBinary ? '(binary)' : data);
   }

   let compress = data && data.length > MIN_COMPRESSABLE_SIZE;
   let status = error == null ? 200 : (error instanceof GError ? error.httpStatus : 500);
   await context.respond(status, data, compress);
}

 

 
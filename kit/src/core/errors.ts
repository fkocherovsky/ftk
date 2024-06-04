export class GError extends Error {
    static APPLICATION_ERROR(message?: string)                   { return new GError(400, message || 'Application error'); }
    static UNSUPPORTED_CLIENT_VERSION(details?: string)          { return new GError(499, 'Unsupported client version' + (details ? ` (${details})` : '')); } // NOTE: the reason this is 499 is that it's used for backward compatibility checks of old clients, and 499 is not expected to be occupied by HTTP spec any time soon
    static GENERAL_ERROR(message?: string)                       { return new GError(500, message || 'General error'); }
    static UNSUPPORTED_OPERATION(message?: string)               { return new GError(500, message || 'Unsupported operation'); }
    static OPERATION_TIMEOUT()                                   { return new GError(504, 'Operation timeout'); }
    static CUSTOM(code: number, message?: string, cause?: Error) { return new GError(code, message, cause); }

    // server errors
    static UNAUTHORIZED(details?: string)                      { return new GError(401, 'Unauthorized' + (details ? ` (${details})` : '')); }
    static NOT_FOUND(details?: string)                         { return new GError(404, 'Not found' + (details ? ` (${details})` : '')); }
    static METHOD_NOT_ALLOWED()                                { return new GError(405, 'Method not allowed'); }
    static PAYLOAD_TOO_LARGE(details?: string)                 { return new GError(413, 'Payload too large' + (details ? ` (${details})` : '')); }
    static PASSWORD_EXPIRED()                                  { return new GError(419, 'Password expired'); }
    static AUTHENTICATION_EXPIRED(details?: string)            { return new GError(424, 'Authentication expired' + (details ? ` (${details})` : '')); }
    static NOT_SUPPORTED(details?: string)                     { return new GError(459, 'Not supported'  + (details ? ` (${details})` : '')); }
     
    code: number;
    cause: Error;
    safeMessage: string; // logic can be overriden by derived classes to hide certain data ('safeMessage' is exposed to client in PROD, instead of 'message')
 
    constructor(message: string, cause?: Error);
    constructor(code: number, message?: string, cause?: Error);
    constructor(codeOrMessage: number | string, messageOrCause?: string | Error, causeOrNothing?: Error) {
       let [code, message, cause] = typeof codeOrMessage == 'string' ? [500, codeOrMessage as string, messageOrCause as Error] : [codeOrMessage as number, messageOrCause as string, causeOrNothing as Error];
       if (message == null) { message = `Unexpected error (${code})`; }
       super(message);
 
       this.code = code;
       this.safeMessage = message;
       if (cause) { this.withCause(cause); }
    }
 
    get isSoft() {
       return this.code < 500 || this.code >= 600; // 6xx are conceptually same errors as 4xx, the only diff is that 4xx are reserved for gml-server, while 6xx are for apps
    }
 
    get httpStatus() {
       if ([400, 401, 403, 404, 405, 413, 500, 504].indexOf(this.code) >= 0) {
          return this.code;
       } else {
          return this.code == null || (this.code >= 500 && this.code <= 599) ? 500 : 400;
       }
    }
 
    // allows to augment exception with original 'cause' exception, so that original exception will be logged, while the user will only get this exception
    withCause(cause: Error): this {
       if (cause) {
          this.cause = cause;
          this.stack += '\n  Caused by: ' + cause.stack;
       }
       return this;
    }
}
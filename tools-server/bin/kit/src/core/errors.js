"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GError = void 0;
class GError extends Error {
    static APPLICATION_ERROR(message) { return new GError(400, message || 'Application error'); }
    static UNSUPPORTED_CLIENT_VERSION(details) { return new GError(499, 'Unsupported client version' + (details ? ` (${details})` : '')); }
    static GENERAL_ERROR(message) { return new GError(500, message || 'General error'); }
    static UNSUPPORTED_OPERATION(message) { return new GError(500, message || 'Unsupported operation'); }
    static OPERATION_TIMEOUT() { return new GError(504, 'Operation timeout'); }
    static CUSTOM(code, message, cause) { return new GError(code, message, cause); }
    static UNAUTHORIZED(details) { return new GError(401, 'Unauthorized' + (details ? ` (${details})` : '')); }
    static NOT_FOUND(details) { return new GError(404, 'Not found' + (details ? ` (${details})` : '')); }
    static METHOD_NOT_ALLOWED() { return new GError(405, 'Method not allowed'); }
    static PAYLOAD_TOO_LARGE(details) { return new GError(413, 'Payload too large' + (details ? ` (${details})` : '')); }
    static PASSWORD_EXPIRED() { return new GError(419, 'Password expired'); }
    static AUTHENTICATION_EXPIRED(details) { return new GError(424, 'Authentication expired' + (details ? ` (${details})` : '')); }
    static NOT_SUPPORTED(details) { return new GError(459, 'Not supported' + (details ? ` (${details})` : '')); }
    constructor(codeOrMessage, messageOrCause, causeOrNothing) {
        let [code, message, cause] = typeof codeOrMessage == 'string' ? [500, codeOrMessage, messageOrCause] : [codeOrMessage, messageOrCause, causeOrNothing];
        if (message == null) {
            message = `Unexpected error (${code})`;
        }
        super(message);
        this.code = code;
        this.safeMessage = message;
        if (cause) {
            this.withCause(cause);
        }
    }
    get isSoft() {
        return this.code < 500 || this.code >= 600;
    }
    get httpStatus() {
        if ([400, 401, 403, 404, 405, 413, 500, 504].indexOf(this.code) >= 0) {
            return this.code;
        }
        else {
            return this.code == null || (this.code >= 500 && this.code <= 599) ? 500 : 400;
        }
    }
    withCause(cause) {
        if (cause) {
            this.cause = cause;
            this.stack += '\n  Caused by: ' + cause.stack;
        }
        return this;
    }
}
exports.GError = GError;
//# sourceMappingURL=errors.js.map
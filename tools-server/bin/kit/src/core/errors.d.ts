export declare class GError extends Error {
    static APPLICATION_ERROR(message?: string): GError;
    static UNSUPPORTED_CLIENT_VERSION(details?: string): GError;
    static GENERAL_ERROR(message?: string): GError;
    static UNSUPPORTED_OPERATION(message?: string): GError;
    static OPERATION_TIMEOUT(): GError;
    static CUSTOM(code: number, message?: string, cause?: Error): GError;
    static UNAUTHORIZED(details?: string): GError;
    static NOT_FOUND(details?: string): GError;
    static METHOD_NOT_ALLOWED(): GError;
    static PAYLOAD_TOO_LARGE(details?: string): GError;
    static PASSWORD_EXPIRED(): GError;
    static AUTHENTICATION_EXPIRED(details?: string): GError;
    static NOT_SUPPORTED(details?: string): GError;
    code: number;
    cause: Error;
    safeMessage: string;
    constructor(message: string, cause?: Error);
    constructor(code: number, message?: string, cause?: Error);
    get isSoft(): boolean;
    get httpStatus(): number;
    withCause(cause: Error): this;
}

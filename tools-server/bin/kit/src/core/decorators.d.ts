export declare function override<T>(baseClass: {
    prototype: T;
}): <F extends keyof T, P extends { [key in F]: T[F]; }>(proto: P, field: F, descr: TypedPropertyDescriptor<T[F]>) => void;

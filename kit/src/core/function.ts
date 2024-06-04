/** A function that always returns the same value that was used as its argument. Only the first argument is returned; all remaining arguments are ignored. */
export function identityFN<T>(value: T, ...rest: any[]): T {
    return value;
}
 
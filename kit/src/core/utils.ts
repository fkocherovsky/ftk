// TODO: DECOR
export namespace Utils {
    export function isPlainObject(obj: any) {
        return (obj && typeof obj === 'object' && !Array.isArray(obj));
    }

    /** returns true if an object is a class definition (https://stackoverflow.com/a/43197340/59770) */
    export function isClass(obj: any) {
        let str = (s: any) => s && s.constructor && s.constructor.toString && s.constructor.toString().substring(0, 5) || null;
        if (obj == null) { return false; }
        if (obj.prototype === undefined) { return str(obj) === 'class'; }
        return str(obj.prototype) === 'class' || str(obj) === 'class';
    }
}
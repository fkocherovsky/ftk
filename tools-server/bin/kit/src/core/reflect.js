"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantiate = exports.toString = exports.toNumber = exports.isClass = exports.isSubClass = exports.isFunction = exports.isEmpty = exports.isArray = exports.isNumber = exports.isBoolean = exports.isString = void 0;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function isBoolean(value) {
    return typeof value === 'boolean';
}
exports.isBoolean = isBoolean;
function isNumber(value) {
    return (typeof value == 'number') && isFinite(value);
}
exports.isNumber = isNumber;
exports.isArray = Array.isArray;
function isEmpty(value) {
    return (value == null || value === '' || value !== value);
}
exports.isEmpty = isEmpty;
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
function isSubClass(subclass, superclass) {
    return superclass && isFunction(subclass) && (subclass == superclass || subclass.prototype instanceof superclass) || false;
}
exports.isSubClass = isSubClass;
function isClass(obj) {
    let str = (s) => s && s.constructor && s.constructor.toString && s.constructor.toString().substring(0, 5) || null;
    if (obj == null) {
        return false;
    }
    if (obj.prototype === undefined) {
        return str(obj) === 'class';
    }
    return str(obj.prototype) === 'class' || str(obj) === 'class';
}
exports.isClass = isClass;
function toNumber(value, fallback) {
    if (value != null && value !== '') {
        let type = typeof value;
        if (type == 'object') {
            if (value instanceof Date) {
                return value.getTime();
            }
        }
        if (type == 'string') {
            value = value.replace(NUMERIC_THOUSANDS_RE, '');
        }
        value = +value;
        if (value === value) {
            return value;
        }
    }
    return (arguments.length > 1 ? fallback : 0);
}
exports.toNumber = toNumber;
const NUMERIC_THOUSANDS_RE = /\,/g;
function toString(value, fallback) {
    if (value == null || value === '') {
        return (arguments.length > 1 ? fallback : '');
    }
    else if (typeof value == 'string') {
        return value;
    }
    else {
        return value.toString();
    }
}
exports.toString = toString;
function instantiate(type, ...args) {
    let instance = Object.create(type.prototype);
    instance = Reflect.construct(instance.constructor, args);
    return instance;
}
exports.instantiate = instantiate;
//# sourceMappingURL=reflect.js.map
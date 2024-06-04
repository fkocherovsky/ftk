// import { identityFN } from "./function";
// import { isArray, isObject } from "./reflect";
// import { Index } from "./types";

// /**
//  * Clones an object instance by creating a deep copy of its members.
//  *
//  * This method creates a deep clone, meaning that the given object, and all the objects that it contains, will be
//  * recursively cloned. To perform a shallow clone, use the `clone` method.
//  *
//  * @template T   The type of object to clone.
//  * @param value  The object instance to deep clone.
//  * @return       The deeply cloned instance.
//  */
// export function cloneDeep<T>(value: T): T {
//     if (value == null || typeof value != 'object') return value;
//     let deep = arguments[1] !== false;
//     let innerClone = deep ? (v: any) => cloneDeep.call(null, v, true, depth + 1) : identityFN;
 
//     // fast check for cyclic references
//     let depth = (arguments.length > 2 ? arguments[2] : 0);
//     if (depth > 50) {
//         // TODO: logger
//         console.log('Cloning operation exceeded maximum depth.');
//         return null;
//     }
 
//     // array-like objects
//     if (isArrayLike(value)) {
//        if (isArray(value)) {
//           // plain array
//           return deep ? value.map(innerClone) : value.slice() as any;
//        } else if (isTypedArray(value)) {
//           // typed array
//           return value.slice() as any;
//        } else {
//           // array-like: Arguments|HTMLCollection|NodeList|NamedNodeMap
//           throw Error(`Cannot clone a '${typeName(value)}' object`);
//        }
//     }
 
//     let obj1 = value as any;
//     let obj2: any;
 
//     // cloneable objects (e.g., Color, DateTime, GeoPoint, or any object implementing CLONE_OP method)
//     if (CLONE_OP in obj1) {
//        return obj1[CLONE_OP]();
//     }
 
//     // plain objects
//     if (isPlainObject(obj1)) {
//        obj2 = (Object.getPrototypeOf(obj1) == null) ? Object.create(null) : {};
//        for (let k in obj1) {
//           if (NATIVE_HASOWN.call(obj1, k)) {
//              obj2[k] = innerClone(obj1[k]);
//           }
//        }
//        return obj2;
//     }
 
//     // builtin Date object
//     if (isDate(obj1)) {
//        return new Date(obj1.getTime()) as any;
//     }
 
//     // // builtin RegeExp object
//     // if (isRegExp(obj1)) {
//     //    return cloneRegex(obj1) as any;
//     // }
 
//     // builtin Map object
//     if (isMap(obj1)) {
//        obj2 = new Map();
//        obj1.forEach((v, k) => obj2.set(k, innerClone(v)));
//        return obj2;
//     }
 
//     // builtin Set object
//     if (isSet(obj1)) {
//        obj2 = new Set();
//        obj1.forEach(v => obj2.add(innerClone(v)));
//        return obj2;
//     }
 
//     // throw exception to avoid bogus cloning of non-plain objects
//     throw Error(`Cannot clone a '${typeName(value)}' object`);
 
//  }
 

// /**
//  * Merges one or more objects into a single object.
//  *
//  * This method performs a deep merge, meaning that the given objects will be memberwise merged, and any objects that they contain
//  * will be in turn recursively merged. To perform a shallow merge, use the `mergeObj` method.
//  *
//  * @template T  The type of objects to merge.
//  * @param args  The objects to merge in order of precedence (i.e., each object overrides the ones preceding it).
//  * @return      The deeply merged object
//  */
// export function mergeDeep<T>(...args: T[]): T {
//     (args as Array<any>).push(true);
//     return mergeObj.apply(null, args);
//  }
 
//  /**
//  * Merges one or more objects into a single object.
//  *
//  * The objects are merged in the order they are listed (i.e., each object overrides the ones preceding it).
//  *
//  * This method performs a shallow merge, meaning that the given objects will be memberwise merged, but any objects that they contain
//  * will remain as the original copy. To perform a deep merge, use the `mergeDeep` method.
//  *
//  * @template T  The type of objects to merge.
//  * @param args  The objects to merge.
//  * @return      The merged object.
//  */
// export function mergeObj<T>(...args: T[]): T {
//     let result: Index<any> = {};
 
//     let nargs = arguments.length;
//     let isDeep = false;
//     if (nargs > 0 && typeof arguments[nargs - 1] == 'boolean') {
//        isDeep = arguments[nargs - 1];
//        nargs--;
//     }
 
//     for (let i = 0; i < nargs; i++) {
//        let source = arguments[i];
//        if (!isObject(source)) continue;
//        for (let k in source) {
//           if (!NATIVE_HASOWN.call(source, k)) continue;
//           let value = source[k];
//           if (isDeep) {
//              if (isObject(value) && !isArray(value)) {
//                 result[k] = mergeDeep(result[k], value);
//              } else {
//                 result[k] = cloneDeep(value);
//              }
//           } else {
//              result[k] = value;
//           }
//        }
//     }
//     return result as T;
//  }
 

//  /////////////////////////////////

//  const NATIVE_HASOWN = Object.prototype.hasOwnProperty;
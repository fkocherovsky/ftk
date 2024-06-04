///////// isXXX
export function isString(value: any): value is string {
    return typeof value === 'string';
}

/** Checks whether a given value is a boolean. */
export function isBoolean(value: any): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Checks whether a given value is a valid and finite number.
 *
 * Note: this function avoids implicit casts, unlike the builtin _isFinite_ function which will return true for values like '123', true, [], etc.
 */
export function isNumber(value: any): value is number {
    return (typeof value == 'number') && isFinite(value);
}

/** Checks whether a given value is a native Array<T>. */
export let isArray: (<T = any>(value: any) => value is T[]) = Array.isArray;

// /** Checks whether a given value is an array-like collection, such as an array, a typed array, an arguments list, a dom nodes list, etc. */
// export function isArrayLike<T = any>(value: any): value is ArrayLike<T> {
//    // fast check the most common cases
//    if (isArray(value)) return true;
//    if (isEmpty(value)) return false;

//    // NOTE: according to the standard any object that has numeric index property access and a numeric length is
//    // an `ArrayLike` object. However, there is no way to check that without iterating over the array items.
//    // So instead we check for the well-known ArrayLike objects by their specific type name.
//    if (isLike(typeName(value), ARRAY_LIKE_RE)) return true;

//    // typed arrays are also array-like
//    if (isTypedArray(value)) return true;

//    return false;
// }
// const ARRAY_LIKE_RE = /Array|Arguments|HTMLCollection|NodeList|NamedNodeMap/;

/** Checks whether a given value is an empty scalar value (i.e. either `null`, `undefined`, `NaN`, or empty string `""`). */
export function isEmpty(value: any): boolean {
   return (value == null || value === '' || value !== value);
}

export function isFunction(value: any): value is Function {
   return typeof value === 'function';
}

/** Checks whether a sub-class is derived (or equal to) a super-class. */
export function isSubClass(subclass: any, superclass: any): boolean {
   return superclass && isFunction(subclass) && (subclass == superclass || subclass.prototype instanceof superclass) || false;
}

// declare interface PlainObject {
//    /** The object lookup index. Returns the item with the specified index key, or `undefined` if not found. */
//    [key: string]: any;

// }

// /** Checks whether a given value is a JavaScript object, which can be either a plain object (see `PlainObject`) or any other constructed object (such as a DOM node, a Date object, a RegExp object, an Array, etc.). */
// export function isObject(value: any): value is Object & PlainObject {
//    return (value != null && typeof value === 'object');
// }


export function isClass(obj: any) {
   let str = (s: any) => s && s.constructor && s.constructor.toString && s.constructor.toString().substring(0, 5) || null;
   if (obj == null) { return false; }
   if (obj.prototype === undefined) { return str(obj) === 'class'; }
   return str(obj.prototype) === 'class' || str(obj) === 'class';
}

///////// toXXX

/**
 * Casts a value to a floating-point number.
 *
 * Note: This method is not locale-aware. For the localized version of this method, use `lang.parseNumber`.
 *
 * @param value      The value to convert.
 * @param fallback   Fallback value to return in case the value is missing or cannot be converted to a number.
 * @return           The converted number.
 */
export function toNumber(value: any, fallback?: number): number {
    if (value != null && value !== '') {
       let type = typeof value;
 
       // if value is temporal, return internal timestamp
       if (type == 'object') {
        // TODO: to define DateTime type
        //   if (value instanceof DateTime) {
        //      return value.time;
        //   }
          if (value instanceof Date) {
             return value.getTime();
          }
       }
 
       // if value is a string, remove thousands separator
       if (type == 'string') {
          value = value.replace(NUMERIC_THOUSANDS_RE, '');
       }
 
       // coerce to number
       value = +value;
 
       // check that value is not NaN
       if (value === value) {
          return value;
       }
    }
    return (arguments.length > 1 ? fallback : 0);
 }
 const NUMERIC_THOUSANDS_RE = /\,/g;

 /**
 * Casts a given value to a string value using the default converter.
 *
 * @param value      The value to convert.
 * @param fallback   Fallback value to return in case the value is missing.
 * @return           The converted string.
 */
export function toString(value: any, fallback?: string): string {
   if (value == null || value === '') {
      return (arguments.length > 1 ? fallback : '');
   } else if (typeof value == 'string') {
      return value;
   } else {
      return value.toString();
   }
}


//////////////

/**
 * Instantiates an object instance of a specified type.
 *
 * @template T   The type of object to create.
 * @param type   The type constructor.
 * @param args   Arguments to pass to the type constructor.
 * @return       The new object instance.
 */
export function instantiate<T>(type: ConstructorOf<T>, ...args: any[]): T {
   let instance = Object.create(type.prototype);

   // ES6: version
   instance = Reflect.construct(instance.constructor, args);

   // ES5: version
   // instance.constructor.apply(instance, args);

   return instance as T;
}

//////////////

// /** Checks whether a given value is a non-blank string (i.e., contains at least one non-whitespace character). */
// export function notBlank(value: any): value is string {
//    return typeof value === 'string' && value.length > 0 && NOT_BLANK_RE.test(value);
// }
// const NOT_BLANK_RE = /\S/;

// /**
//  * Gets the proper type name of a given value.
//  * Use this method instead of the `typeof` operator to get a meaningful result.
//  *
//  * @param  value    The value whose type name to get.
//  * @return          The type name (e.g., Number, String, Array, Function, etc.).
//  */
// export function typeName(value: any): string {
//    // use Object.prototype.toString to extract a better type name than what is returned by typeof operator
//    let name = NATIVE_TYPEOF.call(value).slice(8, -1);
//    if (name == 'Object' && isFunction(value.constructor) && notBlank(value.constructor.name)) {
//       // look for more specific type name through the object constructor
//       return value.constructor.name;
//    }
//    if (name == 'Function' && notBlank(value.name)) {
//       // look for more specific type name assuming the function is the type constructor
//       return value.name;
//    }
//    return name;
// }

/////////////////////////

// const OBJECT_PROTO = Object.prototype;
// const NATIVE_TYPEOF = OBJECT_PROTO.toString;
// const NATIVE_HASOWN = OBJECT_PROTO.hasOwnProperty;


 
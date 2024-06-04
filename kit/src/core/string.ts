// import { isEmpty } from "./reflect";

// export type StringLike = any;

// /**
//  * Checks whether the string matches the specified pattern(s).
//  *
//  * @param value   The string value to check.
//  * @param pattern The pattern(s) to compare the string with.
//  * @return        The result of the check.
//  */
// export function isLike(value: StringLike, ...patterns: Array<string | RegExp>): boolean {
//     if (value == null || value === '') {
//        return !patterns.length || isEmpty(patterns[0]);
//     }
//     let str = _toString(value);
//     for (let pattern of patterns) {
//        if (pattern instanceof RegExp) {
//           return (str === findStr(str, pattern));   // BUG: this check is incorrect for partial patterns, e.g.: isLike('ab', /a|ab|ac/) => false
//        } else if (typeof pattern === 'string') {
//           return (str === _toString(pattern));
//        }
//     }
//     return false;
// }

// /**
//  * Finds the first substring that matches a specified pattern within the given string.
//  *
//  * @param value   The string value to search.
//  * @param pattern The pattern to search for.
//  * @return        The first matching substring, or the empty string if no match was found.
//  */
// export function findStr(value: StringLike, pattern: string | RegExp): string {
//     let result: string = '';
//     let regex = clearRegexFlag(pattern, 'g');
//     if (regex) {
//        _toString(value).replace(regex, str => result = str);
//     }
//     return result;
//  }

//  /**
//  * Clears a regular expression flag.
//  *
//  * @param regex The regular expression.
//  * @param flag  The flag to clear.
//  * @return      The modified regular expression.
//  */
// export function clearRegexFlag(regex: string | RegExp, flag: string): RegExp {
//     regex = toRegExp(regex);
//     flag = toString(flag)[0];
//     if (flag && regex?.flags.indexOf(flag) >= 0) {
//        regex = new RegExp(regex.source, regex.flags.replace(flag, ''));
//     }
//     return regex;
//  }
 
 

// //////////////////////////
// function _toString(value: StringLike, defaultValue?: string): string {
//     if (value == null || value === '') {
//        return (defaultValue !== undefined ? defaultValue : '');
//     } else if (typeof value == 'string') {
//        return value;
//     } else {
//        return value + '';
//     }
//  }
 
 
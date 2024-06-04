// TODO: DECOR
import { isArray } from './reflect';

/** Checks whether a given object (i.e., array, map, set, or plain object) has any entries. */
export function hasEntries(source: any): boolean {
    if (source == null || typeof source != 'object') return false;
    if (isArray(source)) return source.length > 0;
    if ((source instanceof Map) || (source instanceof Set)) return source.size > 0;
    for (let k in source) {
       if (k != null) return true;
    }
    return false;
 }
 
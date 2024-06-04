import { isNumber } from './reflect';
import { roundDecimal } from './numbers';

export interface Index<T> { [key: string]: T; }
export interface Gmap { [key: string]: Gvalue; }
export type Garray = { [key: string]: Gvalue }[];
export type Gvalue = boolean | number | string | boolean[] | number[] | string[] | { [key: string]: Gvalue } | { [key: string]: Gvalue }[];

export function fromJson(str: string): any {
    return JSON.parse(str);
}

const GML_DECIMAL_ROUNDING = 5;
export function toJson(obj: any): string {
   return JSON.stringify(obj, (k, v) => isNumber(v) ? roundDecimal(v, GML_DECIMAL_ROUNDING) : v);
}

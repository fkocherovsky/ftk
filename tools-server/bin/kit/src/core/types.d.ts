export interface Index<T> {
    [key: string]: T;
}
export interface Gmap {
    [key: string]: Gvalue;
}
export type Garray = {
    [key: string]: Gvalue;
}[];
export type Gvalue = boolean | number | string | boolean[] | number[] | string[] | {
    [key: string]: Gvalue;
} | {
    [key: string]: Gvalue;
}[];
export declare function fromJson(str: string): any;
export declare function toJson(obj: any): string;

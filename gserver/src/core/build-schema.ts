import * as Fs from 'fs';
import * as Util from 'util';
import { logEx } from './logger';
import { Index } from '../../../kit/src/core';

let _fsRead = Util.promisify(Fs.readFile);
let _fsReadDir = Util.promisify(Fs.readdir);

// export interface FieldDefinition {
//     /** The field name. */
//     name: string;
//     /** The field type definition or type expression. */
//     type: FieldTypeDefinition | FieldTypeExpression;
//     /** Indicates whether the field is required. */
//     required?: boolean;
//     /** Indicates whether the field is the entity's primary key (applicable only for entity types). */
//     // primaryKey?: boolean;
//     /** Field remarks/description. */
//     remarks?: string;
//     /** Field database name; if defined - a corresponding column will be created in generated database script. */
//     // dbname?: string;
 
// }
 
export interface SchemaDefinition {
    /** The schema type name. */
    name: string;
    /** An optional alias for the schema type. */
    alias?: string;
    /** The parent schema type. */
    // parent?: SchemaDefinition;
    // /** The child schema types. */
    // children?: SchemaDefinition[];
    // /** The imported types. */
    // types?: Index<FieldDefinition[]>;
    /** The schema definition class (either `Entity`, `Taxonomy`, `Service`, or empty for all other schema definition types.) */
    class?: 'Entity' | 'Taxonomy' | 'Service';
    // /** Display title for the schema type. */
    // title?: string;
    /** Summary description of the schema type. */
    summary?: string;
    // /** Additional remarks/description about the schema type. */
    // remarks?: string;
    // /** Indicates whether the schema type definition is inlined inside the schema index. */
    // isInline?: boolean;
    // /** Indicates whether the schema type definition is nested inside inside another schema type definition. */
    // isNested?: boolean;
    // /** Indicates whether the schema type definition is fully loaded. */
    // isLoaded?: boolean;
    // /** Indicates whether this is a special schema type definition (e.g., the schema root, the primitives section, etc.). */
    // isSpecial?: boolean;
    // /** Indicates whether this is a leaf schema type definition. */
    // isLeaf?: boolean;
  }
 

function buildSchema(schemaRoot: string) {

}

function _buildSchema(schemaRoot: string) {
    
}


function _readJSON<T = any>(fName: string): T {
    try {
       let str = _readFile(fName);
       return JSON.parse(str);
    } catch (e) {
       logEx(e, `Failed to read JSON from ${fName}. ${e}`);
    }
    return null;
 }
 

function _readFile(fname: string): string {
    try {
        return Fs.readFileSync(fname, 'utf8');
    } catch (e) {
        logEx(e, `Failed to read file ${fname}`);
    }
    return null;
}

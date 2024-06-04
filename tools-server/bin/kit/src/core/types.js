"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJson = exports.fromJson = void 0;
const reflect_1 = require("./reflect");
const numbers_1 = require("./numbers");
function fromJson(str) {
    return JSON.parse(str);
}
exports.fromJson = fromJson;
const GML_DECIMAL_ROUNDING = 5;
function toJson(obj) {
    return JSON.stringify(obj, (k, v) => (0, reflect_1.isNumber)(v) ? (0, numbers_1.roundDecimal)(v, GML_DECIMAL_ROUNDING) : v);
}
exports.toJson = toJson;
//# sourceMappingURL=types.js.map
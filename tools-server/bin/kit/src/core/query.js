"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasEntries = void 0;
const reflect_1 = require("./reflect");
function hasEntries(source) {
    if (source == null || typeof source != 'object')
        return false;
    if ((0, reflect_1.isArray)(source))
        return source.length > 0;
    if ((source instanceof Map) || (source instanceof Set))
        return source.size > 0;
    for (let k in source) {
        if (k != null)
            return true;
    }
    return false;
}
exports.hasEntries = hasEntries;
//# sourceMappingURL=query.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
var Utils;
(function (Utils) {
    function isPlainObject(obj) {
        return (obj && typeof obj === 'object' && !Array.isArray(obj));
    }
    Utils.isPlainObject = isPlainObject;
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
    Utils.isClass = isClass;
})(Utils = exports.Utils || (exports.Utils = {}));
//# sourceMappingURL=utils.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.toNumber = exports.isBoolean = exports.isArray = exports.isNumber = exports.isString = exports.GError = exports.logI = exports.logEx = exports.logE = void 0;
var logger_1 = require("../../gserver/src/core/logger");
Object.defineProperty(exports, "logE", { enumerable: true, get: function () { return logger_1.logE; } });
Object.defineProperty(exports, "logEx", { enumerable: true, get: function () { return logger_1.logEx; } });
Object.defineProperty(exports, "logI", { enumerable: true, get: function () { return logger_1.logI; } });
var errors_1 = require("./core/errors");
Object.defineProperty(exports, "GError", { enumerable: true, get: function () { return errors_1.GError; } });
var reflect_1 = require("./core/reflect");
Object.defineProperty(exports, "isString", { enumerable: true, get: function () { return reflect_1.isString; } });
Object.defineProperty(exports, "isNumber", { enumerable: true, get: function () { return reflect_1.isNumber; } });
Object.defineProperty(exports, "isArray", { enumerable: true, get: function () { return reflect_1.isArray; } });
Object.defineProperty(exports, "isBoolean", { enumerable: true, get: function () { return reflect_1.isBoolean; } });
Object.defineProperty(exports, "toNumber", { enumerable: true, get: function () { return reflect_1.toNumber; } });
Object.defineProperty(exports, "toString", { enumerable: true, get: function () { return reflect_1.toString; } });
//# sourceMappingURL=core.js.map
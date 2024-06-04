"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundDecimal = void 0;
function roundDecimal(value, decimals) {
    if (!decimals) {
        return Math.round(value);
    }
    else if (decimals > 0) {
        return +Number(value).toFixed(decimals);
    }
    else {
        return _snapDecimal(value, decimals, Math.round);
    }
}
exports.roundDecimal = roundDecimal;
function _snapDecimal(value, decimals, snapFunc) {
    let result = +(snapFunc(+`${value}e${decimals}`) + `e${-decimals}`);
    if (isNaN(result) && !isNaN(value)) {
        result = value;
    }
    return result;
}
//# sourceMappingURL=numbers.js.map
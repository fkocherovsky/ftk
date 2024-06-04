// TODO: DECOR
/**
 * Rounds a number to the specified number of decimal places.
 *
 * @param value     The number to round.
 * @param decimals  Number of places after the decimal point to round to. Default is zero, resulting in integer rounding.
 *                  Can also be negative, resulting in rounding to specified place before the decimal point.
 * @return          The rounded number.
 */
export function roundDecimal(value: number, decimals?: number): number {
    if (!decimals) {
       return Math.round(value);
    } else if (decimals > 0) {
       // NOTES:
       // - the builtin Number.toFixed has some bugs, for example: (2.55).toFixed(1) == 2.5 instead of 2.6
       // - our _snapDecimal polyfill will return correct value in this case _snapDecimal(2.55,1) == 2.6
       // - we still opt to use toFixed because it is slightly faster and also works with values that already have exponent
       return +Number(value).toFixed(decimals);
    } else {
       return _snapDecimal(value, decimals, Math.round);
    }
 }
 

 ///////////////////////////////////////////////////
//#region Assistents

//TODO: DECOR
// snaps value to given precision
function _snapDecimal(value: number, decimals: number, snapFunc: Function): number {
    // use exponential notation to avoid arithmetic rounding errors.
    // for example: Math.Floor(4.27 * 100) / 100 == 4.26 instead of 4.27.
    let result = +(snapFunc(+`${value}e${decimals}`) + `e${-decimals}`);
 
    // fallback in case value is already in exponential notation
    if (isNaN(result) && !isNaN(value)) {
       result = value;
    }
    return result;
 }
 
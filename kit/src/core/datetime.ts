// All this module should be re-written later. This is just temporary implementation of APIs

declare type Timestamp = number;

/** Gets the current clock time (as utc timestamp). */
export const NOW: () => Timestamp = Date.now;

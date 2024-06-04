/** Timestamp in milliseconds since UTC epoch. */
declare type Timestamp = number;

/** Declares a constructor for a class of type `T` (concrete class). */
declare type ConstructorOf<T> = { new(...args: any[]): T; };

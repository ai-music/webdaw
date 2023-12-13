/**
 * The root of the data folder server up by the application.
 */
export const PUBLIC_URL = new URL(process.env.PUBLIC_URL || 'http://localhost:3000/');

/**
 * Common properties for things that have a name.
 */
export interface NamedObject {
  name: string;
}

/**
 * Common properties for things that have a persistent identity.
 *
 * In browsers, a standard way for creating identifiers is `crypto.randomUUID()`.
 */
export interface Identifiable {
  readonly id: string;
}

/**
 * Common properties for things that have a version number.
 *
 * We expect backwards compatibility across objects with the same major version number.
 */
export interface VersionedObject {
  major: number;
  minor: number;
}

/**
 * Default generator for creating new identifier values.
 *
 * @returns a new, unqiue identifier value
 */
export function createId(): string {
  return crypto.randomUUID();
}

/**
 * Common properties for things that have an associated order number.
 *
 * Different from an identifier, the order is used for user interaction purposes only
 * and it may change over time. For a collection of objects, we expect the order numbers
 * of the contained objects to form a continuously increasng sequence of interger values
 * starting with 1.
 */
export interface NumberedObject {
  order: number;
}

/**
 * Common properties for things that have a color.
 */
export interface ColoredObject {
  color: string;
}

/**
 * Common properties for things that can be muted.
 */
export interface MutableObject {
  muted: boolean;
}

/**
 * Common properties for things that can be soloed.
 */
export interface SoloableObject {
  soloed: boolean;
}

/**
 * Common properties for things that can be recorded on.
 */
export interface RecordableObject {
  recording: boolean;
}

/**
 * A type describing proper JSON values.
 */
export type JSONValue = string | number | boolean | { [key: string]: JSONValue } | Array<JSONValue>;
export type JSONObject = { [key: string]: JSONValue };

/**
 * A type describing objects that can be represented as proper JSON.
 */
export interface ToJson {
  toJson(): JSONValue;
}

/**
 * Representation of a duration within the arrangement.
 */
export class Duration {
  constructor(
    /**
     * The number of bars
     */
    public bar: number = 4,

    /**
     * The number of beats
     */
    public beat: number = 0,

    /**
     * The number of ticks
     */
    public tick: number = 0,
  ) {
    /* ... */
  }

  public static fromJson(file: JSONValue): Duration {
    if (!Array.isArray(file)) {
      throw new Error('Invalid JSON value for Duration');
    }

    return new Location(file[0] as number, file[1] as number, file[2] as number);
  }

  public toJson(): JSONValue {
    return [this.bar, this.beat, this.tick];
  }
}

/**
 * Representation of a location within the arrangement.
 */
export class Location {
  constructor(
    /**
     * The number of the bar
     */
    public bar: number = 1,

    /**
     * The beat count
     */
    public beat: number = 1,

    /**
     * The tick count
     */
    public tick: number = 1,
  ) {
    /* ... */
  }

  /**
   * Increment the bar by one
   */
  public incrementBar(): Location {
    return new Location(this.bar + 1, this.beat, this.tick);
  }

  /**
   * Decrement the bar by one
   */
  public decrementBar(): Location {
    return new Location(this.bar - 1, this.beat, this.tick);
  }

  public static fromJson(file: JSONValue): Location {
    if (!Array.isArray(file)) {
      throw new Error('Invalid JSON value for Location');
    }

    return new Location(file[0] as number, file[1] as number, file[2] as number);
  }

  public toJson(): JSONValue {
    return [this.bar, this.beat, this.tick];
  }
}

export class TimeSignature {
  constructor(
    /**
     * The number of beats per bar
     */
    public beatsPerBar: number = 4,

    /**
     * The note value that represents a beat
     */
    public beatNote: number = 4,
  ) {
    /* ... */
  }

  public static fromJson(file: JSONValue): TimeSignature {
    if (!Array.isArray(file)) {
      throw new Error('Invalid JSON value for TimeSignature');
    }

    return new TimeSignature(file[0] as number, file[1] as number);
  }

  public toJson(): JSONValue {
    return [this.beatsPerBar, this.beatNote];
  }
}

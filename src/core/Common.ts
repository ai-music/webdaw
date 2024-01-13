import { PPQN } from './Config';

/**
 * The root of the data folder server up by the application.
 */
export const PUBLIC_URL = new URL(`${window.location.href}`);
//export const PUBLIC_URL = new URL(process.env.PUBLIC_URL || 'http://localhost:3000/');

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
  ) {}

  public get ticksPerBeat(): number {
    return (PPQN * 4) / this.beatNote;
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

/**
 * Representation of a duration within the arrangement.
 */
export class Duration {
  constructor(
    /**
     * The number of bars. Bar durations are counted from 0.
     */
    public bar: number = 4,

    /**
     * The number of beats. Beat durations are counted from 0.
     */
    public beat: number = 0,

    /**
     * The number of ticks. Tick durations are counted from 0.
     */
    public tick: number = 0,
  ) {
    /* ... */
  }

  /**
   * Normalize the duration to the given time signature.
   *
   * @param signature   the time signature to normalize to
   * @returns           the normalized duration
   */
  public normalize(signature: TimeSignature): Duration {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const ticks = this.tick;
    const beats = this.beat + Math.floor(ticks / ticksPerBeat);
    const bars = this.bar + Math.floor(beats / beatsPerBar);

    return new Duration(bars, beats % beatsPerBar, ticks % ticksPerBeat);
  }

  /**
   * Add another duration to this one.
   *
   * @param other     the duration to add
   * @param signature the time signature to normalize to
   * @returns         the sum of the two durations
   */
  public add(other: Duration, signature: TimeSignature): Duration {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const ticks = this.tick + other.tick;
    const beats = this.beat + other.beat + Math.floor(ticks / ticksPerBeat);
    const bars = this.bar + other.bar + Math.floor(beats / beatsPerBar);

    return new Duration(bars, beats % beatsPerBar, ticks % ticksPerBeat);
  }

  /**
   * Compare this duration to another one.
   *
   * The comparison is based on the lexicgraphic order of bars, beats and ticks. Durations are not
   * normalized as part of the comparison operation, but are rather assumed to be normalized.
   *
   * @param other   the other duration
   * @returns       -1 if this location is shorter, 1 if it is longer, and 0 if they are equal
   */
  public compare(other: Duration): number {
    if (this.bar < other.bar) {
      return -1;
    } else if (this.bar > other.bar) {
      return 1;
    } else if (this.beat < other.beat) {
      return -1;
    } else if (this.beat > other.beat) {
      return 1;
    } else if (this.tick < other.tick) {
      return -1;
    } else if (this.tick > other.tick) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Recreate a duration from a JSON value.
   *
   * The JSON value must be an array of three numbers representing the number of bars, beats and ticks.
   * @param json  the JSON value to recreate the duration from
   * @returns     the recreated duration, which may not be normalized
   */
  public static fromJson(json: JSONValue): Duration {
    if (!Array.isArray(json)) {
      throw new Error('Invalid JSON value for Duration');
    }

    return new Duration(json[0] as number, json[1] as number, json[2] as number);
  }

  /**
   * Create a JSON value representing this duration.
   *
   * The JSON value is an array of three numbers representing the number of bars, beats and ticks.
   * @returns the JSON value representing this duration
   */
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
     * The number of the bar. Bar locations are counted from 1.
     */
    public bar: number = 1,

    /**
     * The beat count. Beat locations are counted from 1.
     */
    public beat: number = 1,

    /**
     * The tick count. Tick locations are counted from 1.
     */
    public tick: number = 1,
  ) {
    /* ... */
  }

  public normalize(signature: TimeSignature): Location {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const ticks = this.tick - 1;
    const beats = this.beat - 1 + Math.floor(ticks / ticksPerBeat);
    const bars = this.bar + Math.floor(beats / beatsPerBar);

    return new Location(bars, (beats % beatsPerBar) + 1, (ticks % ticksPerBeat) + 1);
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

  /**
   * Add a duration to this location.
   *
   * @param duration  the duration to add
   * @param signature the time signature to normalize to
   * @returns         the sum of the two durations
   */
  public add(duration: Duration, signature: TimeSignature): Location {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const ticks = this.tick - 1 + duration.tick;
    const beats = this.beat - 1 + duration.beat + Math.floor(ticks / ticksPerBeat);
    const bars = this.bar + duration.bar + Math.floor(beats / beatsPerBar);

    return new Location(bars, (beats % beatsPerBar) + 1, (ticks % ticksPerBeat) + 1);
  }

  /**
   * Subtract a duration from this location.
   *
   * @param duration  the duration to subtract
   * @param signature the time signature to normalize to
   * @returns         the sum of the two durations
   */
  public sub(duration: Duration, signature: TimeSignature): Location {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const [ticks, ticksCarry] =
      this.tick - 1 >= duration.tick
        ? [this.tick - 1 - duration.tick, 0]
        : [this.tick - 1 - duration.tick + ticksPerBeat, 1];
    const [beats, beatsCarry] =
      this.beat - 1 - ticksCarry >= duration.beat
        ? [this.beat - 1 - duration.beat - ticksCarry, 0]
        : [this.beat - 1 - duration.beat - ticksCarry + beatsPerBar, 1];
    const bars = this.bar - duration.bar - beatsCarry;

    return new Location(bars, beats + 1, ticks + 1);
  }

  /**
   * Calculate the difference between two locations.
   *
   * @param other     the other location
   * @param signature the time signature to normalize to
   * @returns         the difference between the two locations
   */
  public diff(other: Location, signature: TimeSignature): Duration {
    const beatsPerBar = signature.beatsPerBar;
    const beatNote = signature.beatNote;
    const ticksPerBeat = (PPQN * 4) / beatNote;

    const [ticks, ticksCarry] =
      other.tick >= this.tick
        ? [other.tick - this.tick, 0]
        : [other.tick - this.tick + ticksPerBeat, 1];
    const [beats, beatsCarry] =
      other.beat + ticksCarry >= this.beat
        ? [other.beat - this.beat - ticksCarry, 0]
        : [other.beat - this.beat - ticksCarry + beatsPerBar, 1];
    const bars = other.bar - this.bar - beatsCarry;

    return new Duration(bars, beats, ticks);
  }

  /**
   * Compare this location to another one.
   *
   * @param other   the other location
   * @returns       -1 if this location is before the other one, 1 if it is after, and 0 if they are equal
   */
  public compare(other: Location): number {
    if (this.bar < other.bar) {
      return -1;
    } else if (this.bar > other.bar) {
      return 1;
    } else if (this.beat < other.beat) {
      return -1;
    } else if (this.beat > other.beat) {
      return 1;
    } else if (this.tick < other.tick) {
      return -1;
    } else if (this.tick > other.tick) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * Recreate a location from a JSON value.
   *
   * The JSON value must be an array of three numbers representing the number of bars, beats and ticks.
   * @param json  the JSON value to recreate the location from
   * @returns     the recreated location, which may not be normalized
   */
  public static fromJson(file: JSONValue): Location {
    if (!Array.isArray(file)) {
      throw new Error('Invalid JSON value for Location');
    }

    return new Location(file[0] as number, file[1] as number, file[2] as number);
  }

  /**
   * Create a JSON value representing this location.
   *
   * The JSON value is an array of three numbers representing the number of bars, beats and ticks.
   * @returns the JSON value representing this location
   */
  public toJson(): JSONValue {
    return [this.bar, this.beat, this.tick];
  }
}

/**
 * Conversion functions between locations and time values.
 */
export interface LocationToTime {
  /**
   * Convert an arrangement location to a time value.
   *
   * @param location  the location to convert
   * @returns         the time value measued in seconds from the start of the arrangement
   */
  convertLocation: (location: Location) => number;

  /**
   * Convert a time value to an arrangement location.
   *
   * @param time      the time value to convert
   * @returns         the location within the arrangement
   */
  convertTime: (time: number) => Location;

  /**
   * Convert a duration starting at a given location within the arrangement to a time value.
   * @param duration  the duration to convert
   * @param location  the location at which the duration starts
   * @returns         the time value measued in seconds
   */
  convertDurationAtLocation: (duration: Duration, location: Location) => number;

  /**
   * Retrieve the time signature at a given location within the arrangement.
   *
   * TIme signatures can change only at the beginning of a bar, therefore, it is
   * primarily the bar number that is used to determine the time signature.
   *
   * @param location the location within the arrangement
   * @returns
   */
  timeSignatureAtLocation: (location: Location) => TimeSignature;
}

/**
 * Assertion function that throws an error if the given condition is false.
 *
 * @param condition   the condition to check
 * @param msg         the error message to throw if the condition is false
 */
export function assert(condition: unknown, msg?: string): asserts condition {
  if (condition === false) throw new Error(msg);
}

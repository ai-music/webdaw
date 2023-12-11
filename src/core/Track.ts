import { AudioFileResolver } from './AudioFile';
import {
  ColoredObject,
  JSONObject,
  JSONValue,
  MutableObject,
  NamedObject,
  RecordableObject,
  SoloableObject,
  ToJson,
} from './Common';
import { RegionInterface } from './Region';

/**
 * The interface of a track towards the Engine.
 */
export interface TrackInterface
  extends NamedObject,
    ColoredObject,
    MutableObject,
    SoloableObject,
    RecordableObject {
  /**
   * Schedule {@link AudioParam} changes to be triggered within the given time range.
   *
   * The time range is specified in high-precision time (as exposed via {@link BaseAudioContext.currentTime}).
   *
   * @param startTime the start time of the time range for which AudioParam changes should be scheduled (exclusive).
   * @param endTime the end time of the time range for which AudioParam changes should be scheduled (inclusive).
   */
  scheduleAudioEvents(startTime: number, endTime: number): void;

  /**
   * Accessor to regions on this track.
   */
  regions: RegionInterface[];
}

/**
 * Base class for all implementations of tracks.
 */
export abstract class AbstractTrack implements TrackInterface, ToJson {
  private _name: string;
  private static _factory: Map<
    string,
    (file: JSONValue, resolver: AudioFileResolver) => AbstractTrack
  > = new Map();

  constructor(
    name: string,
    public color: string,
    public muted: boolean = false,
    public soloed: boolean = false,
    public recording: boolean = false,
  ) {
    this._name = name;
  }

  toJson(): JSONValue {
    return {
      type: this.typeTag,
      name: this.name,
      color: this.color,
      muted: this.muted,
    };
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    throw new Error('Track name cannot be changed.');
  }

  abstract regions: RegionInterface[];
  abstract scheduleAudioEvents(startTime: number, endTime: number): void;

  /**
   * Concrete sub-classes implement this type tag property used for conversion to JSON.
   */
  abstract get typeTag(): string;

  static fromJson(file: JSONValue, resolver: AudioFileResolver): AbstractTrack {
    if (typeof file !== 'object') {
      throw new Error('Invalid JSON value for AbstractTrack');
    }

    const obj = file as JSONObject;
    const factory = this._factory.get(obj['type'] as string);

    if (!factory) {
      throw new Error(`Unknown track type: ${obj['type']}`);
    }

    return factory(obj, resolver);
  }

  /**
   * Allow sub-classes to register themselves with the factory.
   *
   * @param typeTag   type tag associated with the sub-class
   * @param factory   factory function that creates instances of the sub-class
   */
  protected static registerFactory(
    typeTag: string,
    factory: (file: JSONValue, resolver: AudioFileResolver) => AbstractTrack,
  ) {
    this._factory.set(typeTag, factory);
  }
}

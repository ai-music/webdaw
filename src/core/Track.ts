import { AudioFileResolver } from './AudioFile';
import {
  ColoredObject,
  JSONObject,
  JSONValue,
  Location,
  LocationToTime,
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
   * Initialize audio for this track.
   *
   * @param context the audio context to use for initialization
   * @throws {Error} if audio is already initialized for this track using a different audio context.
   */
  initializeAudio(context: AudioContext): void;

  /**
   * Deinitialize audio for this track.
   *
   * @throws {Error} if audio is not initialized
   */
  deinitializeAudio(): void;

  /**
   * Is audio initialized for this track?
   */
  isAudioInitialized(): boolean;

  /**
   * Schedule {@link AudioParam} changes to be triggered within the given time range.
   *
   * The time range is specified in high-precision time (as exposed via {@link BaseAudioContext.currentTime}).
   *
   * Even though the signature of this method is similar to {@link TrackInterface#scheduleMidiEvents}, the
   * semantics of the first parameter is different. In this method, the first parameter is an offset that
   * is added to the arrangement times of the scheduled events. This is useful when scheduling events
   * via {@link AudioParam#setValueAtTime} and related functions. In {@link TrackInterface#scheduleMidiEvents},
   * the first parameter is the current time of the performance within the arrangement. This can be used to
   * determine the delay value for scheduled MIDI events via {link @MIDIOutput#send}.
   *
   * @param timeOffset the offset value to add to arrangement times when scheduling events in the audio context.
   * @param startTime the start time of the time range for which AudioParam changes should be scheduled (exclusive).
   * @param endTime the end time of the time range for which AudioParam changes should be scheduled (inclusive).
   * @param converter an object that converts a location within the arrangement to a time within the audio context.
   */
  scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
  ): void;

  /**
   * Schedule MIDI events to be triggered within the given time range. This includes events processed by
   * internal virtual instruments.
   *
   * Please see description of {@link TrackInterface#scheduleAudioEvents} for an explanation of the
   * semantics of the first parameter.
   *
   * @param currentTime the current time of the performance within the arrangement
   * @param startTime the start time of the time range for which MIDI events should be scheduled (exclusive).
   * @param endTime the end time of the time range for which MIDI events should be scheduled (inclusive).
   * @param converter an object that converts a location within the arrangement to a time within the audio context.
   */
  scheduleMidiEvents(
    currentTime: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
  ): void;

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

  abstract initializeAudio(context: AudioContext): void;
  abstract deinitializeAudio(): void;
  abstract isAudioInitialized(): boolean;

  abstract scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
  ): void;
  abstract scheduleMidiEvents(
    currentTime: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
  ): void;

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

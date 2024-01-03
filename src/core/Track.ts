import { AudioFileResolver } from './AudioFile';
import {
  ColoredObject,
  JSONObject,
  JSONValue,
  LocationToTime,
  MutableObject,
  NamedObject,
  RecordableObject,
  SoloableObject,
  ToJson,
} from './Common';
import { RegionInterface } from './Region';

export interface PlaybackScheduling {
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
   * @param loopIteration the current loop iteration
   * @param continuationTime if provided, any audio that started prior to the schedulinging interval but continues
   *  to play at this time will be scheduled as well.
   * @param discontinuationTime if provided, any audio signal that is being scheduled should be stopped at this time.
   */
  scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void;

  /**
   * Schedule MIDI events to be triggered within the given time range. This includes events processed by
   * internal virtual instruments.
   *
   * Please see description of {@link TrackInterface#scheduleAudioEvents} for an explanation of the
   * semantics of the first parameter.
   *
   * @param timeOffset the offset value to add to arrangement times when scheduling events in the audio context.
   * @param startTime the start time of the time range for which MIDI events should be scheduled (exclusive).
   * @param endTime the end time of the time range for which MIDI events should be scheduled (inclusive).
   * @param converter an object that converts a location within the arrangement to a time within the audio context.
   * @param loopIteration the current loop iteration
   * @param continuationTime if provided, any audio that started prior to the schedulinging interval but continues
   *  to play at this time will be scheduled as well.
   * @param discontinuationTime if provided, any audio signal that is being scheduled should be stopped at this time.
   */
  scheduleMidiEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void;

  /**
   * Adjust the the discontinuationTime for regions that are currently playing back. This is used when
   * the playback end locator or the arrangement end locator is moved during playback.
   *
   * Only regions playback for the current loop iteration are being adjusted.
   *
   * @param oldDicontinuationTime the old continuation time
   * @param newDiscontinuationTime the new continuation time
   * @param converter an object that converts a location within the arrangement to a time (relative to arrangement start).
   * @param loopIteration the current loop iteration
   */
  adjustDiscontinuationTime(
    timeOffset: number,
    oldDiscontinuationTime: number,
    newDiscontinuationTime: number,
    converter: LocationToTime,
    loopIteration: number,
  ): void;

  /**
   * Perform any housekeeping tasks that need to be done on a regular basis.
   * This method is called by the engine at regular intervals.
   *
   * @param currentTime The current time of the performance as exposed by {@link BaseAudioContext.currentTime}.
   */
  housekeeping(currentTime: number): void;

  /**
   * Stop any playback immediately.
   */
  stop(): void;
}

/**
 * The interface of a track towards the Engine.
 */
export interface TrackInterface
  extends NamedObject,
    ColoredObject,
    MutableObject,
    SoloableObject,
    RecordableObject,
    PlaybackScheduling {
  /**
   * Accessor to regions on this track.
   */
  regions: RegionInterface[];

  /**
   * Track volume in dB.
   *
   * -108 corresponds to -inf dB. Maximum value is 6.
   */
  volume: number;

  /**
   * Track pan. -1 is left, 0 is center, 1 is right.
   */
  pan: number;

  /**
   * Is this track enabled?
   *
   * When a track is disabled, it is not scheduled for playback. It also won't emit sound through its output.
   */
  enabled: boolean;
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
    this._name = value;
  }

  abstract regions: RegionInterface[];

  abstract enabled: boolean;
  abstract volume: number;
  abstract pan: number;

  public get gainFromVolume(): number {
    if (this.volume <= -108) {
      return 0;
    } else {
      return Math.pow(2, this.volume / 6);
    }
  }

  abstract initializeAudio(context: AudioContext): void;
  abstract deinitializeAudio(): void;
  abstract isAudioInitialized(): boolean;

  abstract scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void;
  abstract scheduleMidiEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void;
  abstract adjustDiscontinuationTime(
    timeOffset: number,
    oldDiscontinuationTime: number,
    newDiscontinuationTime: number,
    converter: LocationToTime,
    loopIteration: number,
  ): void;
  abstract housekeeping(currentTime: number): void;
  abstract stop(): void;

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

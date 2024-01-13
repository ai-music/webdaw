import { Location, LocationToTime } from './Common';
import { RegionInterface } from './Region';
import { TrackInterface } from './Track';

/**
 * TrackEventType is an enumeration of the different types of track events.
 */
export enum TrackEventType {
  /**
   * A track has been added to the project.
   */
  Added,

  /**
   * A track has been removed from the project.
   */
  Removed,

  /**
   * A track has been muted or unmuted.
   */
  Muted,

  /**
   * A track has been soloed or unsoloed.
   */
  Soloed,

  /**
   * The delay of a track (that is, the microtiming setting) has been changed.
   */
  DelayChanged,

  /**
   * The effects chain of a track has been changed.
   */
  EffectsChainChanged,
}

export class TrackEventArgs {
  /**
   * The old and new mute or solo state of the track.
   */
  readonly oldState?: boolean;
  readonly newState?: boolean;
}

/**
 * A TrackEvent is an event that is related to a track.
 *
 * We have the following types of track events:
 * - a track has been added to the project
 * - a track has been removed from the project
 * - a track has been muted or unmuted
 * - a track has been soloed or unsoloed
 * - the effects chain of a track has been changed
 */
export class TrackEvent {
  constructor(
    public readonly type: TrackEventType,
    public readonly track: TrackInterface,
    public readonly args?: TrackEventArgs,
  ) {
    /* ... */
  }
}

/**
 * The type of a region event.
 */
export enum RegionEventType {
  /**
   * A region has been added to a track.
   */
  Added,

  /**
   * A region has been removed from a track.
   */
  Removed,

  /**
   * A region has been moved to another track.
   */
  Moved,

  /**
   * The start position of the region within the underying recording has been changed.
   */
  StartChanged,

  /**
   * The end position of the region within the underying recording has been changed.
   */
  EndChanged,

  /**
   * A region has been moved to another position.
   */
  PositionChanged,

  /**
   * A region has been muted or unmuted.
   */
  Muted,

  /**
   * A region has been soloed or unsoloed.
   */
  Soloed,
}

/**
 * The arguments of a region event.
 */
export interface RegionEventArgs {
  /**
   * The old and new track that the region has been moved from and to, added to or removed from.
   */
  readonly oldTrack?: TrackInterface;
  readonly newTrack?: TrackInterface;

  /**
   * The old and new start, end or playback position of the region.
   */
  readonly oldPosition?: number;
  readonly newPosition?: number;

  /**
   * The old and new mute or solo state of the region.
   */
  readonly oldState?: boolean;
  readonly newState?: boolean;
}

/**
 * A RegionEvent is an event that is related to a region.
 *
 * We have the following types of region events:
 * - a region has been added to a track
 * - a region has been removed from a track
 * - a region has been moved to another track
 * - a region has been resized
 * - a region has been moved to another position
 * - a region has been muted or unmuted
 * - a region has been soloed or unsoloed
 */
export class RegionEvent {
  constructor(
    public readonly type: RegionEventType,
    public readonly track: TrackInterface,
    public readonly region: RegionInterface,
    public readonly args?: RegionEventArgs,
  ) {
    /* ... */
  }
}

/**
 * TransportEventType is an enumeration of the different types of transport events.
 */
export enum TransportEventType {
  /**
   * The playback position has been changed.
   */
  PositionChanged,

  /**
   * The playback speed (n BPM) has been changed.
   */
  BpmChanged,

  /**
   * The playback loop start locator position has been changed.
   */
  LoopStartLocatorChanged,

  /**
   * The playback loop end locator position has been changed.
   */
  LoopEndLocatorChanged,

  /**
   * The playback end locator position has been changed.
   */
  PlaybackEndLocatorChanged,

  /**
   * The playback loop mode has been changed.
   */
  LoopingChanged,
}

export enum PlaybackEventType {
  /**
   * The playback has been started.
   */
  Started,

  /**
   * Recording has been started.
   */
  RecordingStarted,

  /**
   * The playback has been stopped.
   */
  Stopped,

  /**
   * The playback has been paused.
   */
  Paused,
}

/**
 * A TransportEvent is an event that is related to the overall transport control
 * and playback system.
 *
 * We have the following types of transport events:
 * - the playback position has been changed
 * - the playback bpm has been changed
 * - the playback loop has been changed
 * - the playback has been started
 * - the playback has been stopped
 * - the playback has been paused
 */
export class TransportEvent {
  constructor(
    public readonly type: TransportEventType,
    public readonly location?: Location,
    public readonly bpm?: number,
    public readonly looping?: boolean,
  ) {
    /* ... */
  }
}

/**
 * A PlaybackPositionEvent indicates the current playback timestamp that the engine is rendering.
 * This event is mean for the UI to update the playback position indicator, and does not provide
 * thew necessary precision for scheduling audio and MIDI events.
 */
export class PlaybackPositionEvent {
  constructor(
    public readonly location: Location,
    public readonly timestamp: number,
  ) {
    /* ... */
  }
}

export type PlaybackPositionEventHandler = (event: PlaybackPositionEvent) => void;

/**
 * A PlaybackEvent is an event that is related to the playback of the project.
 *
 * It is raised by the engine when the playback is started, stopped, or paused.
 */
export class PlaybackEvent {
  constructor(
    public readonly type: PlaybackEventType,
    public readonly location?: Location,
  ) {
    /* ... */
  }
}

export type PlaybackEventHandler = (event: PlaybackEvent) => void;

import {
  PlaybackPositionEventHandler,
  RegionEvent,
  RegionEventType,
  TrackEvent,
  TrackEventArgs,
  TrackEventType,
  TransportEvent,
  TransportEventType,
} from './Events';

/**
 * This class encapsulates the rendering engine for audio and MIDI playback.
 */
export class Engine {
  /**
   * Creates a new instance of the `Engine` class.
   * @param context The audio context to use for rendering.
   * @param options The options to use for rendering.
   * @param options.bufferSize The buffer size to use for rendering.
   * @param options.sampleRate The sample rate to use for rendering.
   */
  constructor(
    public readonly context: AudioContext,
    public readonly options: { bufferSize: number; sampleRate: number },
  ) {
    // ...
  }

  /**
   * The interval at which the rendering thread is scheduled.
   *
   * Current setting is for 40 iterations per second.
   */
  readonly scheduleInterval = 0.025; // seconds

  /**
   * The amount of time that the rendering thread will schedule audio and MIDI events
   * ahead of the current time.
   *
   * Current setting is for 100 milliseconds.
   */
  readonly scheduleAhead = 0.1; // seconds

  // What was the high-precision time (relative to audio system time) of the last AUDIO event that was scheduled?
  private lastScheduledAudioTime = 0;

  // What was the high-precision time (relative to MIDI system time) of the last MIDI event that was scheduled?
  private lastScheduledMidiTime = 0;

  // Registered playback position event handlers.
  private playbackPositionEventHandlers: PlaybackPositionEventHandler[] = [];

  /**
   * Start playback of audio and MIDI by the rendering engine.
   */
  public start(): void {
    // ...
  }

  /**
   * Stop playback of audio and MIDI by the rendering engine.
   */
  public stop(): void {
    // ...
  }

  /**
   * Event handler that is listening to transport events.
   *
   * @param event The transport event to handle.
   */
  public handleTransportEvent(event: TransportEvent): void {
    switch (event.type) {
      case TransportEventType.PositionChanged:
        // TODO
        break;
      case TransportEventType.BpmChanged:
        // TODO
        break;
      case TransportEventType.LoopLocatorChanged:
        // TODO
        break;
      case TransportEventType.LoopChanged:
        // TODO
        break;
      case TransportEventType.Started:
        // TODO
        break;
      case TransportEventType.Stopped:
        // TODO
        break;
      case TransportEventType.Paused:
        // TODO
        break;
    }
  }

  /**
   * Event handler that is listening to track events.
   *
   * @param event The track event to handle.
   */
  public handleTrackEvent(event: TrackEvent): void {
    switch (event.type) {
      case TrackEventType.Added:
        // TODO
        break;
      case TrackEventType.Removed:
        // TODO
        break;
      case TrackEventType.Muted:
        // TODO
        break;
      case TrackEventType.Soloed:
        // TODO
        break;
      case TrackEventType.DelayChanged:
        // TODO
        break;
      case TrackEventType.EffectsChainChanged:
        // TODO
        break;
    }
  }

  /**
   * Event handler that is listening to region events.
   *
   * @param event The region event to handle.
   */
  public handleRegionEvent(event: RegionEvent): void {
    switch (event.type) {
      case RegionEventType.Added:
        // TODO
        break;
      case RegionEventType.Removed:
        // TODO
        break;
      case RegionEventType.Moved:
        // TODO
        break;
      case RegionEventType.StartChanged:
        // TODO
        break;
      case RegionEventType.EndChanged:
        // TODO
        break;
      case RegionEventType.PositionChanged:
        // TODO
        break;
      case RegionEventType.Muted:
        // TODO
        break;
      case RegionEventType.Soloed:
        // TODO
        break;
    }
  }

  /**
   * Registers a playback position event handler.
   *
   * @param handler The handler to register.
   */
  public registerPlaybackPositionEventHandler(handler: PlaybackPositionEventHandler): void {
    this.playbackPositionEventHandlers.push(handler);
  }

  /**
   * Unregisters a playback position event handler.
   *
   * @param handler The handler to unregister.
   */
  public unregisterPlaybackPositionEventHandler(handler: PlaybackPositionEventHandler): void {
    this.playbackPositionEventHandlers = this.playbackPositionEventHandlers.filter(
      (h) => h !== handler,
    );
  }
}

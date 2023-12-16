import { Duration, Location } from './Common';
import { PPQN } from './Config';
import {
  PlaybackPositionEvent,
  PlaybackPositionEventHandler,
  RegionEvent,
  RegionEventType,
  TrackEvent,
  TrackEventArgs,
  TrackEventType,
  TransportEvent,
  TransportEventType,
} from './Events';
import { Project } from './Project';

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
    console.log(`Engine: ${context.sampleRate} ${context.currentTime}`);
    console.log(`AudioContext state: ${context.state}`);
  }

  /**
   * The project that is currently loaded into the engine.
   */
  private _project: Project = new Project();

  public get project(): Project {
    return this._project;
  }

  public set project(value: Project) {
    if (this._project !== value) {
      // Unbind tracks from audio destination
      this._project.tracks.forEach((track) => {
        track.deinitializeAudio();
      });

      // set the new project
      this._project = value;

      // Bind tracks to audio destination
      this._project.tracks.forEach((track) => {
        track.initializeAudio(this.context);
      });
    }
  }

  /**
   * The current location in the project. Playback will continue from here, if stopped.
   * */
  public currentLocatator: Location = new Location();

  /**
   * The start locator of the playback loop.
   */
  public loopStart: Location = new Location();

  /**
   * The duration of the playback loop.
   * */
  public loopLength: Duration = new Duration();

  /**
   * The current playback position in seconds.
   */
  public currentTime: number = 0;

  /**
   * Are we currently looping?
   */
  public looping: boolean = false;

  /**
   * Do we have a metronome playing?
   */
  public metronome: boolean = false;

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

  // Are we currently playing?
  private _playing = false;

  // Has a stop been requested?
  private _stopRequested = false;

  // Is this the initial calback into the rendering loop?
  private _isFirstCallback = true;

  // The last callback time into the rendering loop as measured by the audio system clock.
  private _lastCallbackTime = 0;

  // The offset between logic time in the performance and audio system time. This is
  // the audio system time at playback start minus the performance time at playback start.
  private _timeOffset = 0;

  /**
   * Start playback of audio and MIDI by the rendering engine.
   */
  public start(): void {
    if (!this._playing) {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      // Bind tracks to audio destination; this is a no-op when those bindings already exist
      this._project.tracks.forEach((track) => {
        track.initializeAudio(this.context);
      });

      this._playing = true;
      this._stopRequested = false;
      this._isFirstCallback = true;

      // Reset the last callback time and the time offset from audio to arrangement time
      // TODO: This ended up confusing arrangement time with audio time. Pick one for each
      // variable and stick with it.
      const audioTime = this.context.currentTime;
      this._lastCallbackTime = audioTime - this.scheduleInterval;
      this._timeOffset = audioTime - this.currentTime;

      // Reset the last scheduled audio time to the beginning of the arrangement
      // TODO: Eventually, this should be driven by the locators on the track
      this.lastScheduledAudioTime = 0;

      // Run the first callback.
      this.scheduler();
    }
  }

  /**
   * Stop playback of audio and MIDI by the rendering engine.
   */
  public stop(): void {
    this._stopRequested = true;
  }

  /**
   * The scheduler is the main loop of the rendering engine.
   */
  scheduler(): void {
    if (this.context.state === 'suspended') {
      this.context.resume().then(() => {
        this.scheduler();
      });
      return;
    }

    // Get the current time of the audio system.
    const callbackTime = this.context.currentTime;
    console.log(`callbackTime: ${callbackTime}`);
    console.log(`context.state: ${this.context.state}`);

    // How much time has passed since the last callback?
    const deltaTime = callbackTime - this._lastCallbackTime;

    // Update the last callback time.
    this._lastCallbackTime = callbackTime;

    // What's the clock drift?
    const clockDrift = deltaTime - this.scheduleInterval;

    // Logical time within the arrangement
    const arrangementTime = callbackTime - this._timeOffset;
    const lastScheduledAudioTime = this._isFirstCallback
      ? -Number.EPSILON
      : this.lastScheduledAudioTime;

    this._isFirstCallback = false;

    const scheduleAheadTime =
      Math.min(lastScheduledAudioTime, arrangementTime) + this.scheduleAhead;

    console.log(`arrangementTime: ${arrangementTime}`);
    console.log(`lastScheduledAudioTime: ${this.lastScheduledAudioTime}`);
    console.log(`scheduleAheadTime: ${scheduleAheadTime}`);

    // If we are playing, then schedule audio and MIDI events.
    if (this._playing) {
      this._project.tracks.forEach((track) => {
        track.scheduleAudioEvents(
          this._timeOffset,
          lastScheduledAudioTime,
          scheduleAheadTime,
          this._project.locationToTime,
        );
      });

      this.lastScheduledAudioTime = scheduleAheadTime;
    }

    // If we are playing and not stopped, then schedule the next callback.
    if (this._playing && !this._stopRequested) {
      setTimeout(() => this.scheduler(), (this.scheduleInterval - clockDrift) * 1000);
    } else {
      this._playing = false;
    }

    // Notify listeners of the current playback head position.
    if (this.playbackPositionEventHandlers.length > 0) {
      const event = new PlaybackPositionEvent(arrangementTime);
      this.playbackPositionEventHandlers.forEach((handler) => {
        handler(event);
      });
    }
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

import { Duration, Location } from './Common';
import { PPQN } from './Config';
import {
  PlaybackEvent,
  PlaybackEventHandler,
  PlaybackEventType,
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

      // Sync locators from project
      this.syncLocatorsFromProject();
    }
  }

  private syncLocatorsFromProject(): void {
    this.current = this._project.current;
    this.loopStart = this._project.loopStart;
    this.loopEnd = this._project.loopEnd;
    this.end = this._project.end;
  }

  /**
   * The current location in the project. Playback will continue from here, if stopped.
   * */
  public current: Location = new Location();

  /**
   * The current playback position in seconds.
   */
  public currentTime: number = 0;

  /**
   * The start locator of the playback loop.
   */
  public loopStart: Location = new Location();
  private _loopStartTime: number = 0;

  /**
   * The duration of the playback loop.
   * */
  public loopEnd: Location = new Location();
  private _loopEndTime: number = 0;

  /**
   * The end locator of the project.
   */
  public end: Location = new Location();
  private _endTime: number = 0;

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
  // As measured from the beginning of the arrangement.
  private lastScheduledArrangementTime = 0;

  // What was the high-precision time (relative to MIDI system time) of the last MIDI event that was scheduled?
  // As measured from the beginning of the arrangement.
  private lastScheduledMidiTime = 0;

  // Registered playback position event handlers.
  private playbackPositionEventHandlers: PlaybackPositionEventHandler[] = [];

  // Registered playback event handlers
  private playbackEventHandlers: ((event: PlaybackEvent) => void)[] = [];

  // Are we currently playing?
  private _playing = false;

  // Has a stop been requested?
  private _stopRequested = false;

  // The last callback time into the rendering loop as measured by the audio system clock.
  private _lastCallbackTime = 0;

  // The offset between logic time in the performance and audio system time. This is
  // the audio system time at playback start minus the performance time at playback start.
  private _timeOffset = 0;

  /**
   * Is the engine currently playing?
   */
  public get isPlaying(): boolean {
    return this._playing;
  }

  /**
   * Start playback of audio and MIDI by the rendering engine.
   */
  public start(): void {
    if (!this._playing) {
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      // Stop any playback that is currently happening; it's no-op when nothing is playing
      this.silenceTracks();

      // Bind tracks to audio destination; this is a no-op when those bindings already exist
      this._project.tracks.forEach((track) => {
        track.initializeAudio(this.context);
      });

      // Reset the last scheduled audio time to the beginning of the arrangement
      const converter = this.project.locationToTime;

      // sync locators from project
      this.syncLocatorsFromProject();

      // Convert the locators to arrangement time
      this._loopStartTime = converter.convertLocation(this.loopStart);
      this._loopEndTime = converter.convertLocation(
        this.loopEnd.sub(new Duration(0, 0, 1), this.project.timeSignature),
      );
      this._endTime = converter.convertLocation(
        this.end.sub(new Duration(0, 0, 1), this.project.timeSignature),
      );
      this.currentTime = converter.convertLocation(this.current);

      // Reset the last callback time and the time offset from audio to arrangement time
      const audioTime = this.context.currentTime;
      this._lastCallbackTime = audioTime - this.scheduleInterval;
      this._timeOffset = audioTime - this.currentTime;

      if (this.currentTime <= 0) {
        // At the very beginning, just move a minimum amount earlier
        this.lastScheduledArrangementTime = -Number.EPSILON;
      } else {
        // Anywhere beyond the beginning, move by one tick earlier
        this.lastScheduledArrangementTime = this.project.locationToTime.convertLocation(
          this.current.sub(new Duration(0, 0, 1), this.project.timeSignature),
        );
      }

      // Update the state variables that guide the behavior of the scheduler
      this._playing = true;
      this._stopRequested = false;

      // Run the first callback.
      this.scheduler(true);

      // Notify listeners of the playback start.
      if (this.playbackEventHandlers.length > 0) {
        const event = new PlaybackEvent(PlaybackEventType.Started, this.current);
        this.playbackEventHandlers.forEach((handler) => {
          handler(event);
        });
      }
    }
  }

  /**
   * Stop playback of audio and MIDI by the rendering engine.
   */
  public stop(immediately: boolean = false): void {
    this._stopRequested = true;
    this.silenceTracks();
  }

  /**
   * The scheduler is the main loop of the rendering engine.
   */
  scheduler(isFirstCallback: boolean = false): void {
    if (this.context.state === 'suspended') {
      this.context.resume().then(() => {
        this.scheduler();
      });
      return;
    }

    const locationToTime = this._project.locationToTime;
    var continuationTime: number | undefined = isFirstCallback ? this.currentTime : undefined;

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

    var lastScheduledArrangementTime = this.lastScheduledArrangementTime;

    // trigger housekeeping on all tracks
    this._project.tracks.forEach((track) => {
      track.housekeeping(callbackTime);
    });

    // Ensure that we do not schedule beyond the end of the arrangement. In particular,
    // if the user requested stopping the performance, don't schedule anything beyond.
    const scheduleAheadTime = Math.min(
      Math.min(lastScheduledArrangementTime, arrangementTime) + this.scheduleAhead,
      this._stopRequested ? lastScheduledArrangementTime : this._endTime,
    );

    var stopTime = this._stopRequested ? lastScheduledArrangementTime : this._endTime;

    // if we are not looing and will schedule to the end, then request a stop at the end of this
    // scheduling interval
    if (scheduleAheadTime >= this._endTime && !this.looping) {
      this._stopRequested = true;
    }

    console.log(`arrangementTime: ${arrangementTime}`);
    console.log(`lastScheduledAudioTime: ${this.lastScheduledArrangementTime}`);
    console.log(`scheduleAheadTime: ${scheduleAheadTime}`);

    // If we are playing, then schedule audio and MIDI events.
    if (this._playing) {
      const crossingLoopEnd =
        this.lastScheduledArrangementTime < this._loopEndTime &&
        scheduleAheadTime >= this._loopEndTime;

      if (!this.looping || !crossingLoopEnd) {
        var discontinuationTime = this._endTime;
        if (this.looping && lastScheduledArrangementTime < this._loopEndTime) {
          discontinuationTime = this._loopEndTime;
        }

        this._project.tracks.forEach((track) => {
          track.scheduleAudioEvents(
            this._timeOffset,
            lastScheduledArrangementTime,
            scheduleAheadTime,
            locationToTime,
            continuationTime,
            discontinuationTime,
          );
        });

        this.lastScheduledArrangementTime = scheduleAheadTime;
      } else {
        this._project.tracks.forEach((track) => {
          track.scheduleAudioEvents(
            this._timeOffset,
            lastScheduledArrangementTime,
            this._loopEndTime,
            locationToTime,
            continuationTime,
            this._loopEndTime,
          );
        });

        const remainder = scheduleAheadTime - this._loopEndTime + this._loopStartTime;

        // increase the scheduling offset to convert from audio system time to arrangement time
        this._timeOffset += this._loopEndTime - this._loopStartTime;

        this._project.tracks.forEach((track) => {
          track.scheduleAudioEvents(
            this._timeOffset,
            locationToTime.convertLocation(
              this.loopStart.sub(new Duration(0, 0, 1), this.project.timeSignature),
            ),
            remainder,
            locationToTime,
            this._loopStartTime,
            this._loopEndTime,
          );
        });

        this.lastScheduledArrangementTime = remainder;
      }
    }

    // Notify listeners of the current playback head position.
    if (this.playbackPositionEventHandlers.length > 0) {
      const event = new PlaybackPositionEvent(
        locationToTime.convertTime(arrangementTime),
        arrangementTime,
      );
      this.playbackPositionEventHandlers.forEach((handler) => {
        handler(event);
      });
    }

    // If we are playing and not stopped, then schedule the next callback.
    if (this._playing && !this._stopRequested) {
      setTimeout(() => this.scheduler(), (this.scheduleInterval - clockDrift) * 1000);
    } else {
      this._playing = false;

      // Notify listeners of the playback start.
      if (this.playbackEventHandlers.length > 0) {
        const event = new PlaybackEvent(
          PlaybackEventType.Stopped,
          locationToTime.convertTime(stopTime),
        );
        this.playbackEventHandlers.forEach((handler) => {
          handler(event);
        });
      }
    }
  }

  /**
   * Event handler that is listening to transport events.
   *
   * @param event The transport event to handle.
   */
  public handleTransportEvent(event: TransportEvent): void {
    if (!this._playing) {
      switch (event.type) {
        case TransportEventType.PositionChanged:
          this.current = event.location!;
          this.currentTime = this.project.locationToTime.convertLocation(event.location!);
          break;
        case TransportEventType.LoopStartLocatorChanged:
          this.loopStart = event.location!;
          break;
        case TransportEventType.LoopEndLocatorChanged:
          this.loopEnd = event.location!;
          break;
        case TransportEventType.PlaybackEndLocatorChanged:
          this.end = event.location!;
          break;
        case TransportEventType.LoopingChanged:
          this.looping = event.looping!;
          console.log(`looping: ${this.looping}`);
          break;
        case TransportEventType.BpmChanged:
          // TODO
          break;
      }
    } else {
      switch (event.type) {
        case TransportEventType.PositionChanged:
          // TODO
          break;
        case TransportEventType.LoopStartLocatorChanged:
          // TODO
          break;
        case TransportEventType.LoopEndLocatorChanged:
          // TODO
          break;
        case TransportEventType.PlaybackEndLocatorChanged:
          // TODO
          break;
        case TransportEventType.LoopingChanged:
          // TODO
          break;
        case TransportEventType.BpmChanged:
          // TODO
          break;
      }
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

  /**
   * Registers a playback event handler.
   *
   * @param handler The handler to register.
   */
  public registerPlaybackEventHandler(handler: PlaybackEventHandler): void {
    this.playbackEventHandlers.push(handler);
  }

  /**
   * Unregisters a playback event handler.
   *
   * @param handler The handler to unregister.
   */
  public unregisterPlaybackEventHandler(handler: PlaybackEventHandler): void {
    this.playbackEventHandlers = this.playbackEventHandlers.filter((h) => h !== handler);
  }

  /**
   * Stop rendering of all audio and MIDI.
   */
  private silenceTracks(): void {
    this._project.tracks.forEach((track) => {
      track.stop();
    });
  }
}

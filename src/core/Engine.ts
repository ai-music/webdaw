import { Duration, Location } from './Common';
import {
  PlaybackEvent,
  PlaybackEventHandler,
  PlaybackEventType,
  PlaybackPositionEvent,
  PlaybackPositionEventHandler,
  RegionEvent,
  RegionEventType,
  TrackEvent,
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

  // Loop iteration counter; it is reset to 0 when playback starts and incremented by 1
  // when playback jumps to the beginning of the loop.
  private _loopIteration = 0;

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
      this._loopIteration = 0;

      // Notify listeners of the playback start.
      if (this.playbackEventHandlers.length > 0) {
        const event = new PlaybackEvent(PlaybackEventType.Started, this.current);
        this.playbackEventHandlers.forEach((handler) => {
          handler(event);
        });
      }

      // Run the first callback.
      this.scheduler(true);
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
    // console.log(`callbackTime: ${callbackTime}`);
    // console.log(`context.state: ${this.context.state}`);

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

    // console.log(`arrangementTime: ${arrangementTime}`);
    // console.log(`lastScheduledAudioTime: ${this.lastScheduledArrangementTime}`);
    // console.log(`scheduleAheadTime: ${scheduleAheadTime}`);

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
            this._loopIteration,
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
            this._loopIteration,
            continuationTime,
            this._loopEndTime,
          );
        });

        const remainder = scheduleAheadTime - this._loopEndTime + this._loopStartTime;

        // increase the scheduling offset to convert from audio system time to arrangement time
        this._timeOffset += this._loopEndTime - this._loopStartTime;
        this._loopIteration += 1;
        console.log(`loop iteration: ${this._loopIteration}`);

        this._project.tracks.forEach((track) => {
          track.scheduleAudioEvents(
            this._timeOffset,
            locationToTime.convertLocation(
              this.loopStart.sub(new Duration(0, 0, 1), this.project.timeSignature),
            ),
            remainder,
            locationToTime,
            this._loopIteration,
            this._loopStartTime,
            this._loopEndTime,
          );
        });

        this.lastScheduledArrangementTime = remainder;
      }
    }

    // Notify listeners of the current playback head position.
    this._project.current = locationToTime.convertTime(arrangementTime);

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

      this._project.current = locationToTime.convertTime(stopTime);

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

  private adjustPosition(location: Location): void {
    this.current = location;
    this.currentTime = this.project.locationToTime.convertLocation(location);

    // TODO: When playing, behavior is to continue playing until we reach the beats and ticks of the new position.
    // Add that point, we should silence the current playback and effectively schedule a
    // restart at the new position.
  }

  private adjustLoopStart(location: Location): void {
    this.loopStart = location;
    this._loopStartTime = this.project.locationToTime.convertLocation(location);
  }

  private adjustLoopEnd(location: Location): void {
    this.loopEnd = location;
    const oldLoopEndTime = this._loopEndTime;
    const newLoopEndTime = this.project.locationToTime.convertLocation(location);
    this._loopEndTime = newLoopEndTime;

    if (this._project.looping && oldLoopEndTime !== newLoopEndTime) {
      this._project.tracks.forEach((track) => {
        // If playback is inside the loop, we need to adjust playback for any audio regions
        // that are playing back and that have been clipped by the previous loop end time.
        // There is a perceivable race condition were playback of a region that is clipped by the
        // loop end time is scheduled to stop right before we are able to adjust the playback time
        // using the new loop end. However, if we are that close to the loop end, then the scheduler
        // has already processed jumping of playback to the beginning of the loop. So this is not
        // a problem.
        // However, the contrary scenario can be problematic. Loop end is moved to a later time,
        // when the jump to the start of the loop has already been scheduled. In this case, we
        // do not want to adjust the plaback time of any audio regions that are still playing
        // their tail end from the previous loop iteration. To address this, we include a loop
        // iteration counter within the engine, which can be associated with the active playback
        // state of each audio region.
        track.adjustDiscontinuationTime(
          this._timeOffset,
          oldLoopEndTime,
          newLoopEndTime,
          this.project.locationToTime,
          this._loopIteration,
        );
      });
    }
  }

  private adjustEnd(location: Location): void {
    this.end = location;
    const oldEndTime = this._endTime;
    const newEndTime = this.project.locationToTime.convertLocation(location);
    this._endTime = newEndTime;

    // Similar consideration for updating the playbck duration for regions that are currently
    // playing back. The playback state will have been updated by the scheduler to no longer
    // be playing once the end locator has been processed. Therefore, in this branch we are
    // playing back, regions playback can be safely adjusted.
    if (oldEndTime !== newEndTime) {
      this._project.tracks.forEach((track) => {
        track.adjustDiscontinuationTime(
          this._timeOffset,
          oldEndTime,
          newEndTime,
          this.project.locationToTime,
          this._loopIteration,
        );
      });
    }
  }

  private adjustLooping(looping: boolean): void {
    if (this.looping === looping) {
      return;
    }

    if (this._endTime !== this._loopEndTime) {
      if (looping) {
        // looping is turned on: we need to trim the playback time of any audio regions that are
        // currently playing back and that are crossing the loop end time.
        this._project.tracks.forEach((track) => {
          track.adjustDiscontinuationTime(
            this._timeOffset,
            this._endTime,
            this._loopEndTime,
            this.project.locationToTime,
            this._loopIteration,
          );
        });
      } else {
        // looping is turned off: we need to expand the playback time of any audio regions that are
        // currently playing back and that are trimmed at the loop end time.
        this._project.tracks.forEach((track) => {
          track.adjustDiscontinuationTime(
            this._timeOffset,
            this._loopEndTime,
            this._endTime,
            this.project.locationToTime,
            this._loopIteration,
          );
        });
      }
    }

    this.looping = looping;
  }

  private adjustBpm(bpm: number): never {
    // Not implemented yet
    throw new Error('Method not implemented.');
  }

  /**
   * Event handler that is listening to transport events.
   *
   * @param event The transport event to handle.
   */
  public handleTransportEvent(event: TransportEvent): void {
    switch (event.type) {
      case TransportEventType.PositionChanged:
        this.adjustPosition(event.location!);
        break;
      case TransportEventType.LoopStartLocatorChanged:
        this.adjustLoopStart(event.location!);
        break;
      case TransportEventType.LoopEndLocatorChanged:
        this.adjustLoopEnd(event.location!);
        break;
      case TransportEventType.PlaybackEndLocatorChanged:
        this.adjustEnd(event.location!);
        break;
      case TransportEventType.LoopingChanged:
        this.adjustLooping(event.looping!);
        break;
      case TransportEventType.BpmChanged:
        this.adjustBpm(event.bpm!);
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

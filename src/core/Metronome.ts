import { AudioFile } from './AudioFile';
import { Location, LocationToTime, MutableObject, NamedObject, PUBLIC_URL } from './Common';
import { PlaybackScheduling } from './Track';

type AudioState = {
  gain: GainNode;
};

/**
 * The default audio file for the metronome.
 *
 * Eventually, this will be configurable by the user.
 */
export const DEFAULT_METRONOME_AUDIO_FILE: string = `${PUBLIC_URL.toString()}library/samples/sample-pi/drums/one-shots/electric/elec_ping.flac`;

/**
 * The metronome is a special track that is used to schedule metronome clicks.
 */
export class Metronome implements PlaybackScheduling, NamedObject, MutableObject {
  /**
   * The audio state of this track. This is used to keep track of the audio nodes that are
   * used for rendering within an audio context.
   */
  private _audioState: AudioState | null = null;
  private _lastClickNode: AudioBufferSourceNode | null = null;
  private _lastClickTime: number = 0;
  private _audioFile: AudioFile;

  constructor(readonly audioFile: AudioFile) {
    this._audioFile = audioFile;
  }

  prepareInContext(context: AudioContext, callback: () => void): void {
    if (this._audioState === null) {
      this.initializeAudio(context);
    }

    this._audioFile.load(context, callback);
  }

  initializeAudio(context: AudioContext): void {
    if (this._audioState === null) {
      const gain = context.createGain();
      gain.connect(context.destination);
      this._audioState = { gain };
    } else if (this._audioState.gain.context !== context) {
      throw new Error('Audio nodes already initialized with a different audio context');
    }
  }

  deinitializeAudio(): void {
    if (this._audioState !== null) {
      this._audioState.gain.disconnect();
      this._audioState = null;
    } else {
      throw new Error('Audio nodes not initialized');
    }
  }

  isAudioInitialized(): boolean {
    return this._audioState !== null;
  }

  private scheduleClick(clickTime: number, bar: boolean): void {
    if (this._audioState === null) {
      throw new Error('Audio nodes not initialized');
    }

    const context = this._audioState.gain.context;

    const buffer = this._audioFile.buffer;
    const node = context.createBufferSource();
    node.detune.value = bar ? 700 : 0;
    node.buffer = buffer;
    node.connect(this._audioState.gain);
    node.start(clickTime);
    this._lastClickNode = node;
    this._lastClickTime = clickTime;
  }

  scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number | undefined,
    discontinuationTime?: number | undefined,
  ): void {
    // If the metronome is muted, do not schedule any events
    if (this.muted) {
      return;
    }

    // For each beat in the interval, schedule a click
    // There should be at most one beat in any given interval we are presented with here, so
    // we will not attempt to schedule multiple metronome ticks.

    let startLocation = converter.convertTime(startTime);
    let timeSignature = converter.timeSignatureAtLocation(startLocation);

    if (startLocation.beat === 1 && startLocation.tick === 1) {
      // Schedule a bar click at the beginning of the measure
      this.scheduleClick(timeOffset + startTime, true);
      return;
    }

    if (startLocation.tick === 1) {
      // Schedule a beat click at the beginning of the beat
      this.scheduleClick(timeOffset + startTime, false);
      return;
    }

    let nextBar = new Location(startLocation.bar + 1, 1, 1);
    let nextBarTime = converter.convertLocation(nextBar);

    if (nextBarTime < endTime) {
      // Schedule a bar click at the beginning of the next measure
      this.scheduleClick(timeOffset + nextBarTime, true);
      return;
    }

    let nextBeat = new Location(startLocation.bar, startLocation.beat + 1, 1).normalize(
      timeSignature,
    );
    let nextBeatTime = converter.convertLocation(nextBeat);

    if (nextBeatTime < endTime) {
      // Schedule a beat click at the beginning of the next beat
      this.scheduleClick(timeOffset + nextBeatTime, false);
      return;
    }
  }

  scheduleMidiEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number | undefined,
    discontinuationTime?: number | undefined,
  ): void {
    /* no-op */
  }

  adjustDiscontinuationTime(
    timeOffset: number,
    oldDiscontinuationTime: number,
    newDiscontinuationTime: number,
    converter: LocationToTime,
    loopIteration: number,
  ): void {
    /* no-op; these adjustments should not affect the metronome */
  }

  housekeeping(currentTime: number): void {
    if (this._lastClickNode != null && this._lastClickTime < currentTime - 0.1) {
      this._lastClickNode = null;
    }
  }

  stop(): void {
    if (this._lastClickNode !== null) {
      this._lastClickNode.stop();
      this._lastClickNode = null;
    }
  }

  name: string = 'Metronome';
  muted: boolean = true;
}

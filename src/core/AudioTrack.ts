import { start } from 'repl';
import { Registry } from '../effects/Default';
import { AudioEffect } from './AudioEffect';
import { AudioFileResolver } from './AudioFile';
import { AudioRegion } from './AudioRegion';
import { JSONObject, JSONValue, Location, LocationToTime } from './Common';
import { AbstractTrack } from './Track';

type AudioState = {
  panner: StereoPannerNode;
  gain: GainNode;
};

/**
 * A record type to keep track of the audio nodes that are currently active in the audio context.
 */
type ActiveAudioState = {
  // Refrence to the audio node that is currently playing back
  node: AudioScheduledSourceNode;

  // The time at which the audio node will be done generating audio
  activeUntil: number;
};

// Additional time we are applying to the end of the audio region to ensure that it is completely played back
const housekeepingSlack = 0.1;

/**
 * An AudioTrack is a track that contains audio regions, which represent fragments of audio
 * that are to be played back.
 */
export class AudioTrack extends AbstractTrack {
  /**
   * The audio regions contained in this track. Regions are sorted by their start time, so that
   * they can be played back in order.
   */
  regions: AudioRegion[] = [];

  /**
   * The audio effects that are applied to the audio regions in this track. They are ordered by
   * their position in the audio chain.
   */
  audioEffects: AudioEffect[] = [];

  /**
   * The audio state of this track. This is used to keep track of the audio nodes that are
   * used for rendering within an audio context.
   */
  audioState: AudioState | null = null;

  /**
   * The audio state of this track. This is used to keep track of the audio nodes that are
   * currently active in the audio context.
   */
  activeAudioStates: ActiveAudioState[] = [];

  constructor(
    regions: AudioRegion[],
    effects: AudioEffect[],
    name: string,
    color: string,
    muted: boolean,
    soloed: boolean,
    recording: boolean,
  ) {
    super(name, color, muted, soloed, recording);
    this.regions = regions;
    this.audioEffects = effects;
  }

  initializeAudio(context: AudioContext): void {
    if (this.audioState === null) {
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      panner.connect(gain);
      gain.connect(context.destination);
      this.audioState = { gain, panner };
    } else if (this.audioState.gain.context !== context) {
      throw new Error('Audio nodes already initialized with a different audio context');
    }
  }

  deinitializeAudio(): void {
    if (this.audioState !== null) {
      this.audioState.gain.disconnect();
      this.audioState.panner.disconnect();
      this.audioState = null;
    } else {
      throw new Error('Audio nodes not initialized');
    }
  }

  isAudioInitialized(): boolean {
    return this.audioState !== null;
  }

  // Support for JSON serialization/deserialization
  public static TYPE_TAG = 'audio';

  get typeTag(): string {
    return AudioTrack.TYPE_TAG;
  }

  static fromJson(file: JSONValue, resolver: AudioFileResolver): AudioTrack {
    if (typeof file !== 'object') {
      throw new Error('Invalid JSON value for AudioTrack');
    }

    const obj = file as JSONObject;
    const name = obj['name'] as string;
    const color = obj['color'] as string;
    const muted = obj['muted'] as boolean;
    const soloed = obj['soloed'] as boolean;
    const recording = obj['recording'] as boolean;

    const regionJson = obj['regions'] as JSONValue[];
    const regions = regionJson.map((r) => AudioRegion.fromJson(r, resolver));
    const effectsJson = obj['audioEffects'] as JSONValue[];
    const effects: AudioEffect[] = effectsJson.map((e) => Registry.rehydrate(e, resolver));

    return new AudioTrack(regions, effects, name, color, muted, soloed, recording);
  }

  static registerFactory() {
    AbstractTrack.registerFactory(AudioTrack.TYPE_TAG, AudioTrack.fromJson);
  }

  // Playback support
  scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void {
    this.regions.forEach((region) => {
      // TODO: The current code will handle looping at the arrangement level, but not looping of
      // individual audio regions. This will be added later.
      const startPosition = converter.convertLocation(region.position);
      var endPosition =
        startPosition + converter.convertDurationAtLocation(region.length, region.position);

      if (discontinuationTime !== undefined && endPosition > discontinuationTime) {
        endPosition = discontinuationTime;
      }

      console.log(`Region ${region.name} starts at ${startPosition}`);

      if (
        continuationTime !== undefined &&
        startPosition < continuationTime &&
        endPosition >= continuationTime
      ) {
        // Here we have a region that intersects a playback start or a loop start upon loop iteration.
        console.log(`Scheduling straddling audio region ${region.name} at ${continuationTime}`);
        const state = this.audioState!;
        const context = state.panner.context;
        const source = context.createBufferSource();
        const buffer = region.audioFile.buffer;
        console.log(`Buffer duration: ${buffer.duration}`);
        source.buffer = buffer;
        source.connect(state.panner);
        const duration = Math.min(buffer.duration, endPosition - continuationTime);
        const offset = continuationTime - startPosition;
        source.start(timeOffset + continuationTime, offset, duration);

        // trim playback if needed
        if (discontinuationTime !== undefined && endPosition >= discontinuationTime) {
          console.log(`Scheduling stop of audio region ${region.name} at ${discontinuationTime}`);
          source.stop(timeOffset + discontinuationTime);
          this.activeAudioStates.push({
            node: source,
            activeUntil: timeOffset + discontinuationTime,
          });
        } else {
          this.activeAudioStates.push({
            node: source,
            activeUntil: timeOffset + endPosition,
          });
        }
      } else if (startPosition > startTime && startPosition <= endTime) {
        // Here we have a regular region that is scheduled to play back.
        console.log(`Scheduling audio region ${region.name} at ${startPosition}`);
        const state = this.audioState!;
        const context = state.panner.context;
        const source = context.createBufferSource();
        const buffer = region.audioFile.buffer;
        console.log(`Buffer duration: ${buffer.duration}`);
        source.buffer = buffer;
        source.connect(state.panner);
        const duration = Math.min(buffer.duration, endPosition - startPosition);
        source.start(timeOffset + startPosition, 0, duration);

        // trim playback if needed
        if (discontinuationTime !== undefined && endPosition >= discontinuationTime) {
          console.log(`Scheduling stop of audio region ${region.name} at ${discontinuationTime}`);
          source.stop(timeOffset + discontinuationTime);
          this.activeAudioStates.push({
            node: source,
            activeUntil: timeOffset + discontinuationTime,
          });
        } else {
          this.activeAudioStates.push({
            node: source,
            activeUntil: timeOffset + startPosition + duration,
          });
        }
      }
    });
  }

  scheduleMidiEvents(
    currentTime: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void {
    /* No MIDI events on pure audio tracks */
  }

  housekeeping(currentTime: number): void {
    // Remove any audio states that are no longer active
    this.activeAudioStates = this.activeAudioStates.filter((state) => {
      if (state.activeUntil < currentTime + housekeepingSlack) {
        // Strictly speaking, the node should have stopped already, but we'll be nice and stop it again.
        state.node.stop();
        return false;
      } else {
        return true;
      }
    });
  }

  stop(): void {
    this.activeAudioStates.forEach((state) => {
      state.node.stop();
    });
    this.activeAudioStates = [];
  }
}

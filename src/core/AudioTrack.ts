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
  ): void {
    // In the simplest case, find an audio region that overlaps the time range and schedule it.
    //
    // TODO: There are a lot of things missing here for proper playback of regions, including
    // limiting the audible part of the region to the time range, and handling looping.
    // In this simplistic form, it is also not possible to cancel playback while it is in the
    // process of being rendered.
    this.regions.forEach((region) => {
      const startPosition = converter.convertLocation(region.position);
      console.log(`Region ${region.name} starts at ${startPosition}`);
      if (startPosition > startTime && startPosition <= endTime) {
        console.log(`Scheduling audio region ${region.name} at ${startPosition}`);
        const state = this.audioState!;
        const context = state.panner.context;
        const source = context.createBufferSource();
        const buffer = region.audioFile.buffer;
        console.log(`Buffer duration: ${buffer.duration}`);
        source.buffer = buffer;
        source.connect(state.panner);
        const bufferDuration = converter.convertDurationAtLocation(region.length, region.position);
        const duration = Math.min(buffer.duration, bufferDuration);
        source.start(timeOffset + startPosition, 0, duration);
      }
    });
  }

  scheduleMidiEvents(
    currentTime: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
  ): void {
    /* No MIDI events on pure audio tracks */
  }
}

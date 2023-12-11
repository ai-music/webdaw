import { Registry } from '../effects/Default';
import { AudioEffect } from './AudioEffect';
import { AudioFileResolver } from './AudioFile';
import { AudioRegion } from './AudioRegion';
import { JSONObject, JSONValue } from './Common';
import { AbstractTrack } from './Track';

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
  scheduleAudioEvents(startTime: number, endTime: number): void {
    throw new Error('Method not implemented.');
  }
}

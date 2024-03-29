import { JSONObject, JSONValue, Location, LocationToTime } from './Common';
import { MidiEffect } from './MidiEffect';
import { MidiRegion } from './MidiRegion';
import { AbstractTrack } from './Track';

/**
 * A MidiTrack is a track that contains MIDI regions, which represent fragments of MIDI to be
 * sent to an external MIDI device.
 */
export class MidiTrack extends AbstractTrack {
  /**
   * The MIDI regions contained in this track. Regions are sorted by their start time, so that
   * they can be played back in order.
   */
  regions: MidiRegion[] = [];

  /**
   * The MIDI effects that are applied to the MIDI regions in this track. They are ordered by
   * their position in the MIDI chain.
   */
  midiEffects: MidiEffect[] = [];

  /**
   * The MIDI channel that this track is sending MIDI data to.
   */
  channel: number = 0;

  enabled: boolean = true;
  volume: number = 0;
  pan: number = 0;

  // Support for JSON serialization/deserialization
  public static TYPE_TAG = 'midi';

  get type(): string {
    return MidiTrack.TYPE_TAG;
  }

  static fromJson(file: JSONValue): MidiTrack {
    if (typeof file !== 'object') {
      throw new Error('Invalid JSON value for MidiTrack');
    }

    const obj = file as JSONObject;
    return new MidiTrack(obj['name'] as string, obj['color'] as string, obj['muted'] as boolean);
  }

  static registerFactory() {
    AbstractTrack.registerFactory(MidiTrack.TYPE_TAG, MidiTrack.fromJson);
  }

  initializeAudio(context: AudioContext): void {
    /* No audio nodes on pure MIDI tracks */
  }

  deinitializeAudio(): void {
    /* No audio nodes on pure MIDI tracks */
  }

  isAudioInitialized(): boolean {
    return true;
  }

  // Playback support
  scheduleAudioEvents(
    timeOffset: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void {
    /* No audio events on pure MIDI tracks */
  }

  scheduleMidiEvents(
    currentTime: number,
    startTime: number,
    endTime: number,
    converter: LocationToTime,
    loopIteration: number,
    continuationTime?: number,
    discontinuationTime?: number,
  ): void {
    throw new Error('Method not implemented.');
  }

  adjustDiscontinuationTime(
    timeOffset: number,
    oldDiscontinuationTime: number,
    newDiscontinuationTime: number,
    converter: LocationToTime,
    loopIteration: number,
  ): void {}

  housekeeping(currentTime: number): void {}
  stop(): void {}
}

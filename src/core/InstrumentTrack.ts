import { AudioEffect } from './AudioEffect';
import { AudioFileResolver } from './AudioFile';
import { JSONObject, JSONValue } from './Common';
import { Instrument } from './Instrument';
import { MidiEffect } from './MidiEffect';
import { MidiRegion } from './MidiRegion';
import { AbstractTrack } from './Track';

/**
 * An InstrumentTrack is a track that contains MIDI regions, which represent fragments of MIDI
 * that are to be rendered as audio by a built-in instrument or audio module.
 */
export class InstrumentTrack extends AbstractTrack {
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
   * The instrument that is used to render the MIDI regions in this track to audio.
   * The instrument is receiving the MIDI data from the MIDI regions in this track after
   * processing by the MIDI effects.
   */
  instrument: Instrument;

  /**
   * The audio effects that are applied to the audio regions in this track. They are ordered by
   * their position in the audio chain.
   */
  audioEffects: AudioEffect[] = [];

  constructor(name: string, color: string, muted: boolean, instrument: Instrument) {
    super(name, color, muted);
    this.instrument = instrument;
  }

  // Support for JSON serialization/deserialization
  public static TYPE_TAG = 'instrument';

  get typeTag(): string {
    return InstrumentTrack.TYPE_TAG;
  }

  static fromJson(file: JSONValue, resolver: AudioFileResolver): InstrumentTrack {
    if (typeof file !== 'object') {
      throw new Error('Invalid JSON value for InstrumentTrack');
    }

    const obj = file as JSONObject;
    return new InstrumentTrack(
      obj['name'] as string,
      obj['color'] as string,
      obj['muted'] as boolean,
      {} as Instrument,
    );
  }

  static registerFactory() {
    AbstractTrack.registerFactory(InstrumentTrack.TYPE_TAG, InstrumentTrack.fromJson);
  }

  // Playback support
  scheduleAudioEvents(startTime: number, endTime: number): void {
    throw new Error('Method not implemented.');
  }
}

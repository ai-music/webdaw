import { Duration } from './Common';

/**
 * Discriminator for MIDI data types; it's not a true 1-to-1 mapping of MIDI data types, for example,
 * note on and note off are both represented by the Note enum value.
 */
export enum MidiDataType {
  Note,
  KeyPressure,
  ControlChange,
  ProgramChange,
  ChannelPressure,
  PitchBend,
}

export interface BaseMidiData {
  start: Location;
}

export interface NoteMidiData extends BaseMidiData {
  type: MidiDataType.Note;
  note: number;
  duration: Duration;
  velocity: number;
}

export interface KeyPressureMidiData extends BaseMidiData {
  type: MidiDataType.KeyPressure;
  note: number;
  pressure: number;
}

export interface ControlChangeMidiData extends BaseMidiData {
  type: MidiDataType.ControlChange;
  controller: number;
  value: number;
}

export interface ProgramChangeMidiData extends BaseMidiData {
  type: MidiDataType.ProgramChange;
  program: number;
}

export interface ChannelPressureMidiData extends BaseMidiData {
  type: MidiDataType.ChannelPressure;
  pressure: number;
}

export interface PitchBendMidiData extends BaseMidiData {
  type: MidiDataType.PitchBend;
  value: number;
}

export type MidiData =
  | NoteMidiData
  | KeyPressureMidiData
  | ControlChangeMidiData
  | ProgramChangeMidiData
  | ChannelPressureMidiData
  | PitchBendMidiData;

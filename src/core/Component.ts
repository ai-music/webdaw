import { Identifiable, NamedObject } from './Common';

export interface Parameter extends NamedObject {
  /* ... */
}

/**
 * A binding is a signal connection point that is exposed by Component instances.
 */
export interface Binding extends NamedObject {
  /**
   * If true, the binding is a default binding of the component. This means, that unless
   * configured otherwise, the binding will be the default way of connecting the component to
   * upstream or downstream processing elements.
   */
  isDefault: boolean;
}

export interface MidiInput extends Binding {
  /* ... */
}

export interface MidiOutput extends Binding {
  /* ... */
}

export interface AudioInput extends Binding {
  /* ... */
}

export interface AudioOutput extends Binding {
  /* ... */
}

/**
 * Components provide a description of modules that can be plugged into the signal processing path.
 *
 * In its general form, components can process and generate both audio and MIDI signals. They also
 * expose parameters, which can be subject to parameters.
 */
export interface Component extends NamedObject, Identifiable {
  readonly parameters: Parameter[];
  readonly audioInputs: AudioInput[];
  readonly audioOutputs: AudioOutput[];
  readonly midiInputs: MidiInput[];
  readonly midiOutputs: MidiOutput[];
}

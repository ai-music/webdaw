import { AudioFileResolver } from './AudioFile';
import { Identifiable, JSONObject, NamedObject, ToJson, VersionedObject } from './Common';

/**
 * Instances of class AudioEffect process audio signals.
 */
export interface AudioEffect extends NamedObject, Identifiable, VersionedObject, ToJson {
  /* ... */
}

/**
 * A factory for audio effects. Audio effects are created by factories, which allows for
 * serialization and deserialization of audio effects.
 */
export interface AudioEffectFactory {
  instantiate(): AudioEffect;
  rehydrate(json: JSONObject, resolver: AudioFileResolver): AudioEffect;
}

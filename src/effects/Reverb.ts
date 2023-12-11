import { AudioEffect } from '../core/AudioEffect';
import { AudioFileResolver } from '../core/AudioFile';
import { JSONValue } from '../core/Common';

export class Reverb implements AudioEffect {
  static readonly ID: string = 'reverb';
  static readonly MAJOR: number = 0;
  static readonly MINOR: number = 0;

  readonly name = 'Reverb';
  readonly id = Reverb.ID;
  readonly major = Reverb.MAJOR;
  readonly minor = Reverb.MINOR;

  toJson(): JSONValue {
    return {
      id: this.id,
      major: this.major,
      minor: this.minor,
    };
  }

  public static fromJson(json: JSONValue, resolver: AudioFileResolver): Reverb {
    // TODO: Implement properly
    return new Reverb();
  }
}

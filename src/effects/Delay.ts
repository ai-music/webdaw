import { AudioEffect } from '../core/AudioEffect';
import { AudioFileResolver } from '../core/AudioFile';
import { JSONValue } from '../core/Common';

export class Delay implements AudioEffect {
  static readonly ID: string = 'delay';
  static readonly MAJOR: number = 0;
  static readonly MINOR: number = 0;

  readonly name = 'Delay';
  readonly id = Delay.ID;
  readonly major = Delay.MAJOR;
  readonly minor = Delay.MINOR;

  toJson(): JSONValue {
    return {
      id: this.id,
      major: this.major,
      minor: this.minor,
    };
  }

  public static fromJson(json: JSONValue, resolver: AudioFileResolver): Delay {
    // TODO: Implement properly
    return new Delay();
  }
}

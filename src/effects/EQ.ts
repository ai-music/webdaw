import { AudioEffect } from '../core/AudioEffect';
import { AudioFileResolver } from '../core/AudioFile';
import { JSONValue } from '../core/Common';

export class EQ implements AudioEffect {
  static readonly ID: string = 'eq';
  static readonly MAJOR: number = 0;
  static readonly MINOR: number = 0;

  readonly name = 'EQ';
  readonly id = EQ.ID;
  readonly major = EQ.MAJOR;
  readonly minor = EQ.MINOR;

  toJson(): JSONValue {
    return {
      id: this.id,
      major: this.major,
      minor: this.minor,
    };
  }

  public static fromJson(json: JSONValue, resolver: AudioFileResolver): EQ {
    // TODO: Implement properly
    return new EQ();
  }
}

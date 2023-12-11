import { AudioEffect } from '../core/AudioEffect';
import { AudioFileResolver } from '../core/AudioFile';
import { JSONValue } from '../core/Common';

export class Compressor implements AudioEffect {
  static readonly ID: string = 'compressor';
  static readonly MAJOR: number = 0;
  static readonly MINOR: number = 0;

  readonly name = 'Compressor';
  readonly id = Compressor.ID;
  readonly major = Compressor.MAJOR;
  readonly minor = Compressor.MINOR;

  toJson(): JSONValue {
    return {
      id: this.id,
      major: this.major,
      minor: this.minor,
    };
  }

  public static fromJson(json: JSONValue, resolver: AudioFileResolver): Compressor {
    // TODO: Implement properly
    return new Compressor();
  }
}

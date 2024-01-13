import { AudioFile, AudioFileResolver } from './AudioFile';
import { Duration, JSONObject, JSONValue, Location, PUBLIC_URL } from './Common';
import { AbstractRegion, AudioRegionData, RegionDataType } from './Region';

export class AudioRegion extends AbstractRegion {
  constructor(
    readonly audioFile: AudioFile,
    name: string = audioFile.name,
    color: string,
    position: Location = new Location(),
    size: Duration = new Duration(),
    length: Duration = size,
    public trim: Duration = new Duration(0, 0, 0),
    looping: boolean = false,
    muted: boolean = false,
    soloed: boolean = false,

    /** Start of the audio to render relative to the beginning of the audio buffer, in seconds */
    public startTime: number = 0,

    /** End of the audio to render relative to the beginning of the audio buffer, in seconds */
    public endTime: number = audioFile.buffer.duration,
  ) {
    super(name, color, position, size, length, looping, muted, soloed);
  }

  public static fromJson(file: JSONValue, resolver: AudioFileResolver): AudioRegion {
    if (typeof file !== 'object') {
      throw new Error('Invalid JSON value for AudioRegion');
    }

    const obj = file as JSONObject;
    const name = obj['name'] as string;
    const color = obj['color'] as string;
    const muted = obj['muted'] as boolean;
    const soloed = obj['soloed'] as boolean;
    const looping = obj['looping'] as boolean;

    const urlString = `${PUBLIC_URL.toString()}${obj['audioFile'] as string}`;
    const audioFile = resolver.resolve(new URL(urlString));
    const startTime = obj['startTime'] as number;
    const endTime = obj['endTime'] as number;
    const position = Location.fromJson(obj['position']);
    const size = Duration.fromJson(obj['size']);
    const length = Duration.fromJson(obj['length']);
    const trim = Duration.fromJson(obj['trim']);

    return new AudioRegion(
      audioFile,
      name,
      color,
      position,
      size,
      length,
      trim,
      looping,
      muted,
      soloed,
      startTime,
      endTime,
    );
  }

  get data(): AudioRegionData {
    return {
      type: RegionDataType.Audio,
      audioBuffer: this.audioFile.buffer,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }
}

import { DirectionLeft } from '@blueprintjs/icons/lib/esm/generated/16px/paths';
import { AudioFile, AudioFileResolver } from './AudioFile';
import { JSONValue, JSONObject, NamedObject, ToJson, TimeSignature, Location } from './Common';
import { AbstractTrack } from './Track';
import { AudioTrack } from './AudioTrack';
import { InstrumentTrack } from './InstrumentTrack';
import { MidiTrack } from './MidiTrack';
import { PPQN } from './Config';

// Register the track factories
// There is probably a better place for those, but not sure where.
AudioTrack.registerFactory();
InstrumentTrack.registerFactory();
MidiTrack.registerFactory();

/**
 * Top-level container for a project and all its associatd resources.
 */
export class Project implements NamedObject, ToJson, AudioFileResolver {
  public audioFiles: AudioFile[] = [];
  public tracks: AbstractTrack[] = [];

  constructor(
    public name: string = 'Untitled Project',
    public bpm: number = 120,
    public timeSignature: TimeSignature = new TimeSignature(4, 4),
    tracks: AbstractTrack[] = [],
    audioFiles: AudioFile[] = [],
  ) {
    this.tracks = tracks;
    this.audioFiles = audioFiles;
  }

  /**
   * Implement the AudioFileResolver interface. We assume that all audio files encountered
   * during a resolve() call are already part of this project.
   *
   * @param url the url of the audio file to resolve.
   */
  resolve(url: URL): AudioFile {
    return Project.resolveInternal(url, this.audioFiles);
  }

  private static resolveInternal(url: URL, audioFiles: AudioFile[]): AudioFile {
    const files = audioFiles.filter((file) => file.url.toString() === url.toString());

    if (files.length !== 1) {
      throw new Error(
        `Corrupted project file encountered while resolving audio file URL ${url.toString()}.`,
      );
    } else {
      return files[0];
    }
  }

  /**
   *
   * @param context Load all audio files that are referenced by this project.
   *
   * @param callback Completion callback function.
   */
  public async loadFiles(context: AudioContext, callback: (project: Project) => void) {
    var remaining = this.audioFiles.length;

    this.audioFiles.forEach((file) => {
      if (!file.ready) {
        file.load(context, (/*file*/) => {
          --remaining;

          if (remaining === 0) {
            callback(this);
          }
        });
      }
    });
  }

  public toJson(): JSONValue {
    return {
      name: this.name,
      bpm: this.bpm,
      timeSignature: this.timeSignature.toJson(),
      audioFiles: this.audioFiles.map((file) => file.toJson()),
      tracks: this.tracks.map((track) => track.toJson()),
    };
  }

  static fromJson(obj: JSONValue): Project {
    if (typeof obj === 'object') {
      const dict = obj as JSONObject;
      const name = dict['name'] as string;
      const bpm = dict['bpm'] as number;
      const timeSignature = TimeSignature.fromJson(dict['timeSignature']);
      const filesJson = dict['audioFiles'] as Array<JSONValue>;

      if (!Array.isArray(filesJson)) {
        throw Error("'audioFiles' is expected to hold an array value");
      }

      const tracksJson = dict['tracks'] as Array<JSONValue>;
      if (!Array.isArray(tracksJson)) {
        throw Error("'tracksJson' is expected to hold an array value");
      }

      const audioFiles = filesJson.map((file) => AudioFile.fromJson(file));

      const resolver = {
        resolve: function (url: URL): AudioFile {
          return Project.resolveInternal(url, audioFiles);
        },
      };

      const tracks = tracksJson.map((track) => AbstractTrack.fromJson(track, resolver));

      return new Project(name, bpm, timeSignature, tracks, audioFiles);
    } else {
      throw Error('Expected a JSON object as argument');
    }
  }

  /**
   * Create a conversation function from a location to a time in seconds.
   */
  public locationToTimeConverter(): (location: Location) => number {
    const timeSignature = this.timeSignature;
    const beatTime = 60.0 / this.bpm;
    const factor = {
      bars: timeSignature.beatsPerBar * beatTime,
      beats: beatTime,
      ticks: (beatTime / PPQN) * (4.0 / timeSignature.beatNote),
    };

    return (location: Location) =>
      (location.bar - 1) * factor.bars +
      (location.beat - 1) * factor.beats +
      (location.tick - 1) * factor.ticks;
  }
}

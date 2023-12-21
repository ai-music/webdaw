import { DirectionLeft } from '@blueprintjs/icons/lib/esm/generated/16px/paths';
import { AudioFile, AudioFileResolver } from './AudioFile';
import {
  JSONValue,
  JSONObject,
  NamedObject,
  ToJson,
  TimeSignature,
  Location,
  LocationToTime,
  Duration,
} from './Common';
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
    public loopStart: Location = new Location(1, 1, 1),
    public loopEnd: Location = new Location(5, 1, 1),
    public end: Location = new Location(5, 1, 1),
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
   * @param onComplete Completion callback function.
   */
  public async loadFiles(
    context: AudioContext,
    onComplete: (project: Project) => void,
    onProgress: (project: Project, progress: number) => void = (project, progress) => {},
  ) {
    // We determine the number of files that need to be loaded.
    var remaining = this.audioFiles.reduce((acc, file) => (file.ready ? acc : acc + 1), 0);
    if (remaining === 0) {
      onComplete(this);
      return;
    }

    const total = remaining;
    onProgress(this, 0);

    this.audioFiles.forEach((file) => {
      if (!file.ready) {
        file.load(context, (/*file*/) => {
          --remaining;

          if (remaining === 0) {
            onComplete(this);
          } else {
            onProgress(this, (total - remaining) / total);
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
      loopStart: this.loopStart.toJson(),
      loopEnd: this.loopEnd.toJson(),
      end: this.end.toJson(),
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
      const loopStart = Location.fromJson(dict['loopStart']);
      const loopEnd = Location.fromJson(dict['loopEnd']);
      const end = Location.fromJson(dict['end']);
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

      return new Project(name, bpm, timeSignature, loopStart, loopEnd, end, tracks, audioFiles);
    } else {
      throw Error('Expected a JSON object as argument');
    }
  }

  private _locationToTime: LocationToTime = this.createLocationToTime();

  /**
   * Create a conversation object from arrangement locations to a time in seconds.
   */
  public get locationToTime(): LocationToTime {
    return this._locationToTime;
  }

  private createLocationToTime() {
    const timeSignature = this.timeSignature;
    const beatTime = 60.0 / this.bpm;
    const factor = {
      bars: timeSignature.beatsPerBar * beatTime,
      beats: beatTime,
      ticks: (beatTime / PPQN) * (4.0 / timeSignature.beatNote),
    };

    let locationToTime = (location: Location) =>
      (location.bar - 1) * factor.bars +
      (location.beat - 1) * factor.beats +
      (location.tick - 1) * factor.ticks;

    let timeToLocation = (time: number) => {
      let bar = Math.floor(time / factor.bars) + 1;
      time -= (bar - 1) * factor.bars;
      let beat = Math.floor(time / factor.beats) + 1;
      time -= (beat - 1) * factor.beats;
      let tick = Math.floor(time / factor.ticks) + 1;
      return new Location(bar, beat, tick);
    };

    return {
      convertLocation: locationToTime,
      convertTime: timeToLocation,
      convertDurationAtLocation: (duration: Duration, location: Location) =>
        locationToTime(location.add(duration, timeSignature)) - locationToTime(location),
    };
  }
}

import { TrackInterface } from './Track';
import {
  ColoredObject,
  Duration,
  Location,
  MutableObject,
  NamedObject,
  SoloableObject,
} from './Common';
import { MidiData } from './MidiData';

export enum RegionDataType {
  Audio,
  Midi,
}

export interface BaseRegionData {
  type: RegionDataType;
}

export interface AudioRegionData extends BaseRegionData {
  type: RegionDataType.Audio;
  audioBuffer: AudioBuffer;
  startTime: number;
  endTime: number;
}

export interface MidiRegionData extends BaseRegionData {
  type: RegionDataType.Midi;
  midiData: MidiData[];
}

export type RegionData = AudioRegionData | MidiRegionData;

export type Cache = {
  [id: string]: string;
};

/**
 * The interface of a region towards the Engine.
 */
export interface RegionInterface extends NamedObject, ColoredObject, MutableObject, SoloableObject {
  /**
   * The start position of the region within the underying recording.
   * Represented in bars, (beats, sixteenths, and ticks as faction).
   */
  position: Location;

  /**
   * The size of the region within the underying recording.
   * Represented in bars, (beats, sixteenths, and ticks as faction).
   * The size is the length of the basic, unrepeated region, without any looping.
   */
  size: Duration;

  /**
   * The start position of the region within the underying recording.
   * Represented in bars, (beats, sixteenths, and ticks as faction).
   * The length is tho total length of the region, including looping.
   */
  length: Duration;

  /**
   * Is this region looped?
   */
  looping: boolean;

  /**
   * The data contained in this region.
   */
  data: RegionData;

  /**
   * Cache for UX rendering of the region data.
   */
  cache: Cache;
}

export abstract class AbstractRegion implements RegionInterface {
  private _name: string;

  constructor(
    name: string,
    public color: string,
    public position: Location = new Location(),
    public size: Duration = new Duration(),
    public length: Duration = new Duration(),
    public looping: boolean = false,
    public muted: boolean = false,
    public soloed: boolean = false,
  ) {
    this._name = name;
  }

  public cache: Cache = {} as Cache;

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    throw new Error('Region name cannot be changed.');
  }

  abstract get data(): RegionData;
}

import { Duration, Location } from './Common';
import { MidiData } from './MidiData';
import { AbstractRegion, MidiRegionData, RegionDataType } from './Region';

export class MidiRegion extends AbstractRegion {
  constructor(
    readonly midiData: MidiData[] = [],
    name: string,
    color: string,
    position: Location = new Location(),
    size: Duration = new Duration(),
    length: Duration = size,
    looping: boolean = false,
    muted: boolean = false,
    soloed: boolean = false,
    public startLocation: Location = new Location(),
  ) {
    super(name, color, position, size, length, looping, muted, soloed);
  }

  get data(): MidiRegionData {
    return {
      type: RegionDataType.Midi,
      midiData: this.midiData,
    };
  }
}

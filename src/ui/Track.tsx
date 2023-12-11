import { FunctionComponent } from 'react';

import { TrackInfo, TrackInfoProps } from './TrackInfo';
import { Region, RegionProps } from './Region';
import { TrackAutomation } from './TrackAutomation';

import styles from './Track.module.css';
import { TrackInterface } from '../core/Track';

export interface TrackProps {
  track: TrackInterface;
  index: number;
  start: number;
  scale: number;
}

export const Track: FunctionComponent<TrackProps> = (props: TrackProps) => {
  // Fixed size TrackInfo and stack of track content and TrackAutomation
  return (
    <div className={styles.track}>
      <TrackInfo index={props.index} name={props.track.name} color={props.track.color} />
      <div className={styles.rail}>
        {props.track.regions.map((region) => (
          <Region region={region} start={props.start} scale={props.scale} />
        ))}
        {/* <TrackAutomation /> */}
      </div>
    </div>
  );
};

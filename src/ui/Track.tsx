import { FunctionComponent } from 'react';

import { TrackInfo, TrackInfoProps } from './TrackInfo';
import { Region, RegionProps } from './Region';
import { TrackAutomation } from './TrackAutomation';

import styles from './Track.module.css';

export interface TrackProps extends TrackInfoProps {
  regions: RegionProps[];
  start: number;
  scale: number;
}

export const Track: FunctionComponent<TrackProps> = (props: TrackProps) => {
  // Fixed size TrackInfo and stack of track content and TrackAutomation
  return (
    <div className={styles.track}>
      <TrackInfo {...props} />
      <div className={styles.rail}>
        {props.regions.map((region) => (
          <Region {...region} />
        ))}
        {/* <TrackAutomation /> */}
      </div>
    </div>
  );
};

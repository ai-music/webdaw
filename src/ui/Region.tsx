import { FunctionComponent } from 'react';

import styles from './Region.module.css';
import { RegionInterface } from '../core/Region';
import { Location, LocationToTime } from '../core/Common';

export interface RegionProps {
  region: RegionInterface;
  start: number;
  scale: number;
  converter: LocationToTime;
}

export const Region: FunctionComponent<RegionProps> = (props: RegionProps) => {
  const style = {
    backgroundColor: props.region.color,
    width: `${/*props.region.length*/ 8}rem`, // FIXME: This should be calculated from the region length
    left: `${props.converter.convertLocation(props.region.position) * 4}rem`,
  };

  return (
    <div className={styles.region} style={style}>
      {props.region.name}
    </div>
  );
};

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
    width: `${
      props.converter.convertDurationAtLocation(props.region.length, props.region.position) *
      props.scale
    }rem`,
    left: `${props.converter.convertLocation(props.region.position) * props.scale}rem`,
  };

  return (
    <div className={styles.region} style={style}>
      {props.region.name}
    </div>
  );
};

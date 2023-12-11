import { FunctionComponent } from 'react';

import styles from './Region.module.css';
import { RegionInterface } from '../core/Region';

export interface RegionProps {
  region: RegionInterface;
  start: number;
  scale: number;
}

export const Region: FunctionComponent<RegionProps> = (props: RegionProps) => {
  const style = {
    backgroundColor: props.region.color,
    width: `${props.region.length}rem`,
    left: `${props.region.position}rem`,
  };

  return (
    <div className={styles.region} style={style}>
      {props.region.name}
    </div>
  );
};

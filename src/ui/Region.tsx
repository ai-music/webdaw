import { FunctionComponent, useState } from 'react';

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
  const [selected, setSelected] = useState(false);

  const style = {
    borderColor: props.region.color,
    width: `${
      props.converter.convertDurationAtLocation(props.region.length, props.region.position) *
      props.scale
    }rem`,
    left: `${props.converter.convertLocation(props.region.position) * props.scale}rem`,
    backgroundColor: selected ? props.region.color : 'transparent',
  };

  function toggleSelection() {
    setSelected(!selected);
  }

  return (
    <div className={styles.region} style={style} onClick={toggleSelection}>
      {props.region.name}
    </div>
  );
};

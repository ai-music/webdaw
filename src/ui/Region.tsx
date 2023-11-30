import { FunctionComponent } from 'react';

import styles from './Region.module.css';

export interface RegionProps {
  name: string;
  color: string;
  begin: number;
  length: number;
}

export const Region: FunctionComponent<RegionProps> = (props: RegionProps) => {
  const style = {
    backgroundColor: props.color,
    width: `${props.length}rem`,
    left: `${props.begin}rem`,
  };

  return (
    <div className={styles.region} style={style}>
      {props.name}
    </div>
  );
};

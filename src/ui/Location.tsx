import { FunctionComponent } from 'react';
import { Location as LocationObj } from '../core/Common';
import { EditableText } from '@blueprintjs/core';

import styles from './Location.module.css';

export type Props = {
  label: string;
  location: LocationObj;
  setLocation: (location: LocationObj) => void;
};

export const Location: FunctionComponent<Props> = (props) => {
  return (
    <span>
      <div className="bp5-text-small">
        <label>{props.label}</label>
      </div>
      <div>
        <EditableText
          className={styles.bar}
          value={props.location.bar.toString().padStart(3, '0')}
          onChange={(value) =>
            props.setLocation(
              new LocationObj(parseInt(value), props.location.beat, props.location.tick),
            )
          }
          maxLength={4}
        />
        <b>:</b>
        <EditableText
          className={styles.beat}
          value={props.location.beat.toString().padStart(1, '0')}
          onChange={(value) =>
            props.setLocation(
              new LocationObj(props.location.bar, parseInt(value), props.location.tick),
            )
          }
          maxLength={2}
        />
        <b>:</b>
        <EditableText
          className={styles.tick}
          value={props.location.tick.toString().padStart(3, '0')}
          onChange={(value) =>
            props.setLocation(
              new LocationObj(props.location.bar, props.location.beat, parseInt(value)),
            )
          }
          maxLength={4}
        />
      </div>
    </span>
  );
};

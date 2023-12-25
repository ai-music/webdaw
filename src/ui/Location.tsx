import { FunctionComponent, useState } from 'react';
import { Location as LocationObj, TimeSignature } from '../core/Common';
import { EditableText } from '@blueprintjs/core';

import styles from './Location.module.css';

export type Props = {
  timeSignature: TimeSignature;
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
          minWidth={32}
          confirmOnEnterKey={true}
          value={props.location.bar.toString()}
          onChange={(value) => {
            const newBars = parseInt(value);
            if (!isNaN(newBars) && newBars >= 1 && newBars <= 999) {
              props.setLocation(new LocationObj(newBars, props.location.beat, props.location.tick));
            }
          }}
          selectAllOnFocus={true}
          maxLength={3}
        />
        <b>:</b>
        <EditableText
          className={styles.beat}
          minWidth={16}
          confirmOnEnterKey={true}
          value={props.location.beat.toString()}
          onChange={(value) => {
            const newBeats = parseInt(value);
            if (!isNaN(newBeats) && newBeats >= 1 && newBeats <= props.timeSignature.beatsPerBar) {
              props.setLocation(new LocationObj(props.location.bar, newBeats, props.location.tick));
            }
          }}
          selectAllOnFocus={true}
          maxLength={2}
        />
        <b>:</b>
        <EditableText
          className={styles.tick}
          minWidth={32}
          confirmOnEnterKey={true}
          value={props.location.tick.toString()}
          onChange={(value) => {
            const newTicks = parseInt(value);
            if (!isNaN(newTicks) && newTicks >= 1 && newTicks <= props.timeSignature.ticksPerBeat) {
              props.setLocation(new LocationObj(props.location.bar, props.location.beat, newTicks));
            }
          }}
          selectAllOnFocus={true}
          maxLength={4}
        />
      </div>
    </span>
  );
};

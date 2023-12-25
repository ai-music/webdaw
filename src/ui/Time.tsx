import { FunctionComponent, useState } from 'react';

import styles from './Time.module.css';
import { EditableText, NumericInput } from '@blueprintjs/core';
import { DiffieHellmanGroupConstructor } from 'crypto';

export type Props = {
  label: string;
  timestamp: number;
  setTimestamp: (timestamp: number) => void;
};

function destructureTime(timestamp: number): [number, number, number, number] {
  const date = new Date(timestamp * 1000); // Convert timestamp to milliseconds
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  return [hours, minutes, seconds, milliseconds];
}

function constructTime(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): number {
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

export const Time: FunctionComponent<Props> = (props) => {
  const [hours, minutes, seconds, milliseconds] = destructureTime(props.timestamp);

  return (
    <div>
      <div className="bp5-text-small">
        <label>{props.label}</label>
      </div>
      <div>
        <EditableText
          className={styles.hours}
          confirmOnEnterKey={true}
          value={hours.toString()}
          minWidth={16}
          onChange={(value) => {
            const newHours = parseInt(value);
            if (!isNaN(newHours) && newHours >= 0 && newHours < 24) {
              props.setTimestamp(constructTime(newHours, minutes, seconds, milliseconds));
            }
          }}
          selectAllOnFocus={true}
          maxLength={4}
        />
        <b>:</b>
        <EditableText
          className={styles.minutes}
          confirmOnEnterKey={true}
          value={minutes.toString()}
          minWidth={16}
          onChange={(value) => {
            const newMinutes = parseInt(value);
            if (!isNaN(newMinutes) && newMinutes >= 0 && newMinutes <= 59) {
              props.setTimestamp(constructTime(hours, newMinutes, seconds, milliseconds));
            }
          }}
          selectAllOnFocus={true}
          maxLength={3}
        />
        <b>:</b>
        <EditableText
          className={styles.seconds}
          confirmOnEnterKey={true}
          value={seconds.toString()}
          minWidth={16}
          onChange={(value) => {
            const newSeconds = parseInt(value);
            if (!isNaN(newSeconds) && newSeconds >= 0 && newSeconds <= 59) {
              props.setTimestamp(constructTime(hours, minutes, newSeconds, milliseconds));
            }
          }}
          selectAllOnFocus={true}
          maxLength={3}
        />
        <b>:</b>
        <EditableText
          className={styles.milliseconds}
          confirmOnEnterKey={true}
          value={milliseconds.toString()}
          minWidth={32}
          onChange={(value) => {
            const newMilliseconds = parseInt(value);
            if (!isNaN(newMilliseconds) && newMilliseconds >= 0 && newMilliseconds <= 999) {
              props.setTimestamp(constructTime(hours, minutes, seconds, newMilliseconds));
            }
          }}
          selectAllOnFocus={true}
          maxLength={4}
        />
      </div>
    </div>
  );
};

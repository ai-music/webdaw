import { Button, ButtonGroup, EditableText, Slider } from '@blueprintjs/core';
import { FunctionComponent, useState } from 'react';

import styles from './TrackInfo.module.css';
import { Knob } from './Knob';
import { TRACK_HEIGHT_PX } from './Config';

function renderVolumeLabel(val: number, opts?: { isHandleTooltip: boolean }) {
  return val <= -102 ? `-\u2060inf\u00A0dB` : `${val.toFixed(1)}\u00A0dB`;
}

function panRenderer(val: number, opts?: { isHandleTooltip: boolean }) {
  return val === 0 ? 'C' : val < 0 ? `L\u00A0${-val.toFixed(0)}` : `${val.toFixed(0)}\u00A0R`;
}

export interface TrackInfoProps {
  index: number;
  name: string;
  color: string;
}

export const TrackInfo: FunctionComponent<TrackInfoProps> = (props: TrackInfoProps) => {
  const [name, setName] = useState(props.name);
  const [volume, setVolume] = useState(0);
  const [mute, setMute] = useState(false);
  const [solo, setSolo] = useState(false);
  const [record, setRecord] = useState(false);

  return (
    <div
      className={styles.trackinfo}
      style={{ gridRow: props.index + 1, gridColumn: 1, height: TRACK_HEIGHT_PX }}
    >
      <div className={styles.controls}>
        <EditableText className={styles.name} value={name} onChange={(val) => setName(val)} />
        <ButtonGroup className={styles.control}>
          <Button
            icon="disable"
            small
            active={mute}
            onClick={() => {
              setMute(!mute);
            }}
            intent={mute ? 'warning' : 'none'}
          />
          <Button
            icon="clip"
            small
            active={solo}
            onClick={() => {
              setSolo(!solo);
            }}
            intent={solo ? 'success' : 'none'}
          />
          <Button
            icon="record"
            small
            active={record}
            onClick={() => {
              setRecord(!record);
            }}
            intent={record ? 'danger' : 'none'}
          />
        </ButtonGroup>
        <div>
          <Knob
            label="Pan"
            min={-50}
            max={50}
            labelRenderer={panRenderer}
            noLabels={true}
            size={30}
          />
        </div>
      </div>
      <div>
        <Slider
          min={-102}
          max={6}
          labelValues={[]}
          vertical={false}
          intent="primary"
          labelRenderer={renderVolumeLabel}
          className={styles.volume}
          value={volume}
          onChange={(val) => {
            setVolume(val);
          }}
          onRelease={(val) => {
            setVolume(val);
          }}
          showTrackFill={false}
        />
      </div>
    </div>
  );
};

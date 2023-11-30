import { FunctionComponent, useState } from 'react';

import styles from './Channel.module.css';
import { Button, ButtonGroup, EditableText, Slider } from '@blueprintjs/core';
import { Knob } from './Knob';

export interface Bus {
  name: string;
  color: string;
}

export interface ChannelProps {
  index: number;
  name: string;
  color: string;
  buses: Bus[];
}

function renderVolumeLabel(val: number, opts?: { isHandleTooltip: boolean }) {
  return val <= -102 ? `-\u2060inf\u00A0dB` : `${val.toFixed(1)}\u00A0dB`;
}

function panRenderer(val: number, opts?: { isHandleTooltip: boolean }) {
  return val === 0 ? 'C' : val < 0 ? `L\u00A0${-val.toFixed(0)}` : `${val.toFixed(0)}\u00A0R`;
}

export const Channel: FunctionComponent<ChannelProps> = (props: ChannelProps) => {
  const [name, setName] = useState(props.name);
  const [volume, setVolume] = useState(0);
  const [mute, setMute] = useState(false);
  const [solo, setSolo] = useState(false);
  const [record, setRecord] = useState(false);

  // Vertical stack of:
  // - Inline effect slots
  // - Return channel sends
  // - Pan control
  // - Channel fader
  // - Mute button
  // - Solo button
  // - Input active button
  // - Record button
  // - Channel/Track name
  return (
    <div className={styles.channel}>
      {props.buses.map((bus) => (
        <Knob label={bus.name} min={-102} max={6} labelRenderer={renderVolumeLabel} size={70} />
      ))}
      <Knob label="Pan" min={-50} max={50} labelRenderer={panRenderer} size={70} />
      <Slider
        min={-102}
        max={6}
        labelStepSize={12}
        vertical={true}
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
      <div className={styles.buttons}>
        <ButtonGroup>
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
      </div>
      <div className={styles.name} style={{ background: props.color }}>
        <EditableText className={styles.editor} value={name} onChange={(value) => setName(value)} />
      </div>
    </div>
  );
};

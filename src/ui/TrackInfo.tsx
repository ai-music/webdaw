import { Button, ButtonGroup, EditableText, Slider } from '@blueprintjs/core';
import { FunctionComponent, useState } from 'react';

import styles from './TrackInfo.module.css';
import { Knob } from './Knob';
import { TRACK_HEIGHT_PX, UX_PAN_SCALE } from './Config';
import { TrackInterface } from '../core/Track';
import { MAX_VOLUME_DB, MIN_VOLUME_DB } from '../core/Config';

function renderVolumeLabel(val: number, opts?: { isHandleTooltip: boolean }) {
  return val <= MIN_VOLUME_DB ? `-\u2060inf\u00A0dB` : `${val.toFixed(1)}\u00A0dB`;
}

function panRenderer(val: number, opts?: { isHandleTooltip: boolean }) {
  return val === 0 ? 'C' : val < 0 ? `L\u00A0${-val.toFixed(0)}` : `${val.toFixed(0)}\u00A0R`;
}

export interface TrackInfoProps {
  index: number;
  track: TrackInterface;
  updateTrackEnablement: () => void;
}

export const TrackInfo: FunctionComponent<TrackInfoProps> = (props: TrackInfoProps) => {
  const [name, setName] = useState(props.track.name);
  const [volume, setVolume] = useState(props.track.volume);
  const [pan, setPan] = useState(props.track.pan * UX_PAN_SCALE); // [-50, 50]
  const [mute, setMute] = useState(props.track.muted);
  const [solo, setSolo] = useState(props.track.soloed);
  const [record, setRecord] = useState(false);
  const [color, setColor] = useState(props.track.color);

  function changeMute(mute: boolean) {
    setMute(mute);
    props.track.muted = mute;
    props.updateTrackEnablement();
  }

  function changeSolo(solo: boolean) {
    setSolo(solo);
    props.track.soloed = solo;
    props.updateTrackEnablement();
  }

  function changeVolume(volume: number) {
    setVolume(volume);
    props.track.volume = volume;
  }

  function changePan(pan: number) {
    setPan(pan);
    props.track.pan = pan / UX_PAN_SCALE;
  }

  function changeName(name: string) {
    setName(name);
    props.track.name = name;
  }

  function changeColor(color: string) {
    setColor(color);
    props.track.color = color;
  }

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
              changeMute(!mute);
            }}
            intent={mute ? 'warning' : 'none'}
          />
          <Button
            icon="clip"
            small
            active={solo}
            onClick={() => {
              changeSolo(!solo);
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
            min={-UX_PAN_SCALE}
            max={UX_PAN_SCALE}
            labelRenderer={panRenderer}
            noLabels={true}
            size={30}
            value={pan}
            onChange={(val) => {
              changePan(val);
            }}
          />
        </div>
      </div>
      <div>
        <Slider
          min={MIN_VOLUME_DB}
          max={MAX_VOLUME_DB}
          labelValues={[]}
          vertical={false}
          intent="primary"
          labelRenderer={renderVolumeLabel}
          className={styles.volume}
          value={volume}
          onChange={(val) => {
            changeVolume(val);
          }}
          onRelease={(val) => {
            changeVolume(val);
          }}
          showTrackFill={false}
        />
      </div>
    </div>
  );
};

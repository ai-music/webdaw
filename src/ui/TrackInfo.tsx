import {
  Button,
  ButtonGroup,
  Card,
  EditableText,
  Overlay,
  Popover,
  Slider,
} from '@blueprintjs/core';
import { FunctionComponent, useEffect, useState } from 'react';

import styles from './TrackInfo.module.css';
import { Knob } from './Knob';
import { TRACK_HEIGHT_PX, UX_PAN_SCALE } from './Config';
import { TrackInterface } from '../core/Track';
import { MAX_VOLUME_DB, MIN_VOLUME_DB } from '../core/Config';
import Compact from '@uiw/react-color-compact';

function renderVolumeLabel(val: number, opts?: { isHandleTooltip: boolean }) {
  return val <= MIN_VOLUME_DB ? `-\u2060inf\u00A0dB` : `${val.toFixed(1)}\u00A0dB`;
}

function panRenderer(val: number, opts?: { isHandleTooltip: boolean }) {
  return val === 0 ? 'C' : val < 0 ? `L\u00A0${-val.toFixed(0)}` : `${val.toFixed(0)}\u00A0R`;
}

export interface TrackInfoProps {
  delete: () => void;
  index: number;
  track: TrackInterface;
  updateTrackEnablement: () => void;
  colorChange: (color: string) => void;
}

export const TrackInfo: FunctionComponent<TrackInfoProps> = (props: TrackInfoProps) => {
  const [name, setName] = useState(props.track.name);
  const [volume, setVolume] = useState(props.track.volume);
  const [pan, setPan] = useState(props.track.pan * UX_PAN_SCALE); // [-50, 50]
  const [mute, setMute] = useState(props.track.muted);
  const [solo, setSolo] = useState(props.track.soloed);
  const [record, setRecord] = useState(props.track.recording);
  const [color, setColor] = useState(props.track.color);
  // const [toggleColor, setToggleColor] = useState(false);

  useEffect(() => {
    setMute(props.track.muted);
    setSolo(props.track.soloed);
    setVolume(props.track.volume);
    setPan(props.track.pan * UX_PAN_SCALE);
    setName(props.track.name);
    setColor(props.track.color);
    setRecord(props.track.recording);
  }, [props.track]);

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
    props.colorChange(color);
  }

  return (
    <div className={styles.trackinfo} style={{ height: TRACK_HEIGHT_PX }}>
      <div>
        <div className={styles.controls}>
          <EditableText className={styles.name} value={name} onChange={(val) => changeName(val)} />
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
              disabled={true}
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
        <div className={styles.secondRow}>
          <Popover
            content={
              <Card compact>
                <h3>Track Properties</h3>
                <h4>Track Color</h4>
                <Compact color={color} onChange={(val) => changeColor(val.hex)} />
                <h4>Danger Zone</h4>
                <Button intent="danger" onClick={() => props.delete()}>
                  Delete Track
                </Button>
              </Card>
            }
            placement="right-start"
          >
            <Button
              icon="menu"
              small
              minimal
              outlined={false}
              onSelect={(e) => {
                e.preventDefault();
                return false;
              }}
              // onClick={() => {
              //   props.delete();
              // }}
              className={styles.menu}
            />
          </Popover>
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
    </div>
  );
};

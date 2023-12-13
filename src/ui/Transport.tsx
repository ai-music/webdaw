import { FunctionComponent, useState } from 'react';
import { Location } from './Location';
import { Time } from './Time';
import { Button, ButtonGroup, EditableText, Intent, Switch } from '@blueprintjs/core';
import { Location as LocationValue } from '../core/Common';
import { Project as ProjectObj } from '../core/Project';

import styles from './Transport.module.css';
import { Engine } from '../core/Engine';

/**
 * The different states of playback
 */
export enum PlaybackState {
  Stopped,
  Playing,
  Recording,
}

export type TransportProps = {
  project: ProjectObj;
  engine: Engine;
};

export const Transport: FunctionComponent<TransportProps> = (props: TransportProps) => {
  const [playback, setPlayback] = useState(PlaybackState.Stopped);
  const [loop, setLoop] = useState(false);
  const [start, setStart] = useState(new LocationValue(1, 1, 1));
  const [end, setEnd] = useState(new LocationValue(5, 1, 1));
  const [current, setCurrent] = useState(new LocationValue(5, 1, 1));
  const [bpm, setBpm] = useState(120);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);

  function onBegin() {
    console.log('To beginning');
  }

  function onEnd() {
    console.log('To end');
  }

  function onForward() {
    console.log('Advance...');
  }

  function onBackward() {
    console.log('Go back...');
  }

  function play() {
    console.log('Play');
    setPlayback(PlaybackState.Playing);
    props.engine.start();
  }

  function pause() {
    console.log('Pause');
    setPlayback(PlaybackState.Stopped);
    props.engine.stop();
  }

  function record() {
    console.log('Record');
    setPlayback(PlaybackState.Recording);
    props.engine.start();
  }

  function repeat() {
    console.log('Repeat');
    setLoop(!loop);
  }

  return (
    <div className={styles.transport}>
      <ButtonGroup>
        <Button icon="step-backward" onClick={onBegin} />
        <Button icon="fast-backward" onClick={onBackward} />
        <Button
          icon="play"
          disabled={playback !== PlaybackState.Stopped}
          intent={playback === PlaybackState.Playing ? Intent.SUCCESS : undefined}
          onClick={play}
        />
        <Button icon="pause" disabled={playback === PlaybackState.Stopped} onClick={pause} />
        <Button
          icon="record"
          disabled={playback !== PlaybackState.Stopped}
          intent={playback === PlaybackState.Recording ? Intent.DANGER : undefined}
          onClick={record}
        />
        <Button icon="fast-forward" onClick={onForward} />
        <Button icon="step-forward" onClick={onEnd} />
        <Button
          icon="repeat"
          onClick={repeat}
          active={loop}
          intent={loop ? Intent.PRIMARY : Intent.NONE}
        />
      </ButtonGroup>
      <div>
        <div className="bp5-text-small">
          <label>Metronome</label>
        </div>
        <Switch inline />
      </div>
      <div>
        <div className="bp5-text-small">
          <label>BPM</label>
        </div>
        <EditableText
          value={bpm.toFixed(0)}
          onChange={(value) => setBpm(parseInt(value))}
          maxLength={3}
          className={styles.bpm}
        />
      </div>
      <div>
        <div className="bp5-text-small">
          <label>Signature</label>
        </div>
        <div>
          <EditableText
            value={denominator.toFixed(0)}
            onChange={(value) => setDenominator(parseInt(value))}
            maxLength={3}
            className={styles.denominator}
          />
          /
          <EditableText
            value={numerator.toFixed(0)}
            onChange={(value) => setNumerator(parseInt(value))}
            maxLength={3}
            className={styles.numerator}
          />
        </div>
      </div>
      <Time label="Time" />
      <Location label="Current" />
      <Location label="Start" />
      <Location label="End" />
    </div>
  );
};

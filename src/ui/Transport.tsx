import { FunctionComponent, useState } from 'react';
import { Location } from './Location';
import { Time } from './Time';
import { Button, ButtonGroup, EditableText, Switch } from '@blueprintjs/core';

import styles from './Transport.module.css';

export const Transport: FunctionComponent = () => {
  const [bpm, setBpm] = useState(120);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);

  return (
    <div className={styles.transport}>
      <ButtonGroup>
        <Button icon="step-backward" />
        <Button icon="fast-backward" />
        <Button icon="play" />
        <Button icon="pause" />
        <Button icon="record" />
        <Button icon="fast-forward" />
        <Button icon="step-forward" />
        <Button icon="repeat" />
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

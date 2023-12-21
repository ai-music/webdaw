import { FunctionComponent, useEffect, useState } from 'react';
import { Location } from './Location';
import { Time } from './Time';
import { Button, ButtonGroup, EditableText, Intent, Popover, Switch } from '@blueprintjs/core';
import { Location as LocationValue } from '../core/Common';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';
import { PlaybackPositionEvent, TransportEventType } from '../core/Events';

import styles from './Transport.module.css';
import { auto } from '@popperjs/core';
import { MAX_TIMELINE_SCALE, MIN_TIMELINE_SCALE, Timeline } from './Timeline';

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
  timelineScale: number;
  setTimelineScale: (scale: number) => void;

  // setBpm: (bpm: number) => void;
  // bpm: number;
  // setNumerator: (numerator: number) => void;
  // numerator: number;
  // setDenominator: (denominator: number) => void;
  // denominator: number;
  // setLoop: (loop: boolean) => void;
  // loop: boolean;
  // setLoopStart: (loopStart: LocationValue) => void;
  // loopStart: LocationValue;
  // setLoopEnd: (loopEnd: LocationValue) => void;
  // loopEnd: LocationValue;
  // setCurrent: (current: LocationValue) => void;
  // current: LocationValue;
  // setEnd: (end: LocationValue) => void;
  // end: LocationValue;
  // setTimestamp: (timestamp: number) => void;
  // timestamp: number;

  // toBeginning: () => void;
  // toEnd: () => void;
  // advance: () => void;
  // goBack: () => void;

  // setPlayback: (playback: PlaybackState) => void;
  // playback: PlaybackState;

  // zoomIn: () => void;
  // zoomOut: () => void;
  // zoomToFit: () => void;

  // canZoomIn: boolean;
  // canZoomOut: boolean;
};

export const Transport: FunctionComponent<TransportProps> = (props: TransportProps) => {
  const [playback, setPlayback] = useState(PlaybackState.Stopped);
  const [loop, setLoop] = useState(false);
  const [loopStart, setLoopStart] = useState(props.project.loopStart);
  const [loopEnd, setLoopEnd] = useState(props.project.loopEnd);
  const [current, setCurrent] = useState(new LocationValue(5, 1, 1));
  const [end, setEnd] = useState(props.project.end);
  const [bpm, setBpm] = useState(120);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [timestamp, setTimestamp] = useState(0); // [hh, mm, ss, uuuu]

  const [showZoom, setShowZoom] = useState(false);

  const changeLoopStart = (location: LocationValue) => {
    setLoopStart(location);
    props.project.loopStart = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.LoopStartLocatorChanged,
      location: location,
    });
  };

  const changeLoopEnd = (location: LocationValue) => {
    setLoopEnd(location);
    props.project.loopEnd = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.LoopEndLocatorChanged,
      location: location,
    });
  };

  const changeEnd = (location: LocationValue) => {
    setEnd(location);
    props.project.end = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.PlaybackEndLocatorChanged,
      location: location,
    });
  };

  const positionEventHandler = (event: PlaybackPositionEvent) => {
    setCurrent(event.location);
    setTimestamp(event.timestamp);
  };

  useEffect(() => {
    props.engine.registerPlaybackPositionEventHandler(positionEventHandler);
    return () => {
      props.engine.unregisterPlaybackPositionEventHandler(positionEventHandler);
    };
  }, [props.engine]);

  function onBegin() {
    console.log('To beginning');
    // if the current position is before the loop start, go to the loop start
    // else go to the beginning
  }

  function onEnd() {
    console.log('To end');
    // if the current position is before the loop end, go to the loop end
    // else go to the end
  }

  function onForward() {
    console.log('Advance...');
    // advance the current position by one bar
  }

  function onBackward() {
    console.log('Go back...');
    // go back the current position by one bar
  }

  function play() {
    console.log('Play');
    // should chnage the behavior to play from the current position
    setPlayback(PlaybackState.Playing);
    props.engine.start();
  }

  function pause() {
    console.log('Pause');
    // needs to be changed such that the audio generation stops more or less immediately
    setPlayback(PlaybackState.Stopped);
    props.engine.stop();
  }

  function record() {
    console.log('Record');
    // should change the behavior to record from the current position
    // ultimately, this will require a count-in prior to the recording starting
    setPlayback(PlaybackState.Recording);
    props.engine.start();
  }

  function repeat() {
    console.log('Repeat');
    // add loop support to the playback process
    setLoop(!loop);
  }

  function zoomIn() {
    console.log('Zoom in');
    props.setTimelineScale(Math.min(props.timelineScale * 2, MAX_TIMELINE_SCALE));
  }

  function zoomOut() {
    console.log('Zoom out');
    props.setTimelineScale(Math.max(props.timelineScale / 2, MIN_TIMELINE_SCALE));
  }

  function zoomToFit() {
    console.log('Zoom to fit');
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
        <Switch inline style={{ maxHeight: '0.80rem' }} />
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
      <Time label="Time" timestamp={timestamp} />
      <Location label="Current" location={current} setLocation={setCurrent} />
      <Location label="Loop Start" location={loopStart} setLocation={changeLoopStart} />
      <Location label="Loop End" location={loopEnd} setLocation={changeLoopEnd} />
      <Location label="End" location={end} setLocation={changeEnd} />
      <div className={styles.spacer}>&nbsp;</div>
      <ButtonGroup className={styles.zoomButtons}>
        {/* <Popover
          content={<div>TODO: Zoom using a slider</div>}
          interactionKind="click"
          placement="bottom"
          renderTarget={() => <Button icon="rect-width" onClick={() => setShowZoom(!showZoom)} />}
          isOpen={showZoom}
        /> */}
        <Button
          icon="zoom-out"
          onClick={zoomOut}
          disabled={props.timelineScale <= MIN_TIMELINE_SCALE}
        />
        <Button
          icon="zoom-in"
          onClick={zoomIn}
          disabled={props.timelineScale >= MAX_TIMELINE_SCALE}
        />
        <Button icon="zoom-to-fit" onClick={zoomToFit} />
      </ButtonGroup>
    </div>
  );
};

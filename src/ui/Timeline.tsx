import { FunctionComponent, useRef, useState } from 'react';

import styles from './Timeline.module.css';
import { Duration, Location, LocationToTime, TimeSignature } from '../core/Common';
import { PPQN } from '../core/Config';
import { Icon } from '@blueprintjs/core';

export interface TimelineProps {
  start: number;
  scale: number;
  timeSignature: TimeSignature;
  converter: LocationToTime;
  setLoopStart: (loopStart: Location) => void;
  loopStart: Location;
  setLoopEnd: (loopEnd: Location) => void;
  loopEnd: Location;
  setEnd: (end: Location) => void;
  end: Location;
  looping: boolean;
}

class TimelineGenerator implements IterableIterator<Location> {
  private step: Duration;
  private end: Location;
  private current: Location;
  private signature: TimeSignature;

  constructor(start: Location, end: Location, step: Duration, signature: TimeSignature) {
    this.step = step;
    this.end = end;
    this.signature = signature;
    this.current = start;
  }

  [Symbol.iterator](): IterableIterator<Location> {
    return this;
  }

  next(): IteratorResult<Location> {
    const done = this.current.compare(this.end) > 0;

    const result = {
      done: done,
      value: this.current,
    };

    this.current = this.current.add(this.step, this.signature);

    return result;
  }
}

export const MIN_TIMELINE_SCALE = 0.25;
export const MAX_TIMELINE_SCALE = 64.0;

// A timeline component across the top of the arrangement view.
// It needs to be aligned with the actual track content visualizations and
// provides UX interactions for positioning of the playback head and the zoom level.
// The Timeline also visualizes the locator positions, loop mode, and the current
// position of the playback head.
// For zooming, we are setting  scale factor. The scale factor is in the range of
// 0.125 to 64.0.
// At the scale of 8 or more, we are showing major ticks at beats, minor ticks at 16th notes.
// Labels are shown for each beat, indicating bar and beat number.
// At the scale of 2, or more, we are showing major ticks at bars, minor ticks at beats.
// Labels are shown for each bar, indicating bar number.
// At the scale of 0.5, we are showing major ticks at 4 bar marks, minor ticks at bars.
// Labels are shown for each 4th bar, indicating bar number.

export const Timeline: FunctionComponent<TimelineProps> = (props: TimelineProps) => {
  function barLabel(location: Location): string {
    return `${location.bar}`;
  }

  function beatLabel(location: Location): string {
    return `${location.bar}:${location.beat}`;
  }

  const rangeStart = new Location(1, 1, 1);
  const rangeEnd = props.end;
  const signature = props.timeSignature;

  type Settings = {
    majorStep: Duration;
    minorStep: Duration;
    label: (location: Location) => string;
  };

  function calculateSettings(scale: number): Settings {
    if (scale >= 16) {
      return {
        majorStep: new Duration(0, 1, 0),
        minorStep: new Duration(0, 0, PPQN / 4),
        label: beatLabel,
      };
    } else if (scale >= 2) {
      return {
        majorStep: new Duration(1, 0, 0),
        minorStep: new Duration(0, 1, 0),
        label: barLabel,
      };
    } else {
      return {
        majorStep: new Duration(4 / scale, 0, 0),
        minorStep: new Duration(1 / scale, 0, 0),
        label: barLabel,
      };
    }
  }

  const settings = calculateSettings(props.scale);

  const labelIterator = new TimelineGenerator(rangeStart, rangeEnd, settings.majorStep, signature);
  const tickIterator = new TimelineGenerator(rangeStart, rangeEnd, settings.minorStep, signature);

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(0);
  const dragStartValue = useRef(new Location());
  const dragStartValueTime = useRef(0);
  const dragTarget = useRef<SVGSVGElement | null>(null);

  function onMouseDownEnd(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStart.current = event.clientX;
    dragStartValue.current = props.end;
    dragStartValueTime.current = props.converter.convertLocation(props.end);
    dragTarget.current = event.currentTarget;
  }

  function onMouseMoveEnd(event: React.PointerEvent<SVGSVGElement>) {
    if (isDragging) {
      const delta = event.clientX - dragStart.current;
      const valueTime = dragStartValueTime.current + delta / props.scale / 16;
      const newValue = props.converter.convertTime(valueTime);

      if (newValue !== props.end) {
        props.setEnd(newValue);
      }
    }
  }

  function onMouseUpEnd(event: React.PointerEvent<SVGSVGElement>) {
    if (isDragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      const delta = event.clientX - dragStart.current;
      const valueTime = dragStartValueTime.current + delta / props.scale / 16;
      const newValue = props.converter.convertTime(valueTime);

      // TODO: implement snap to settings.minorStep duration

      if (newValue !== props.end) {
        props.setEnd(newValue);
      }
      setIsDragging(false);
    }
  }

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineFront}>&nbsp;</div>
      <div className={styles.timelineBack}>
        <div className={styles.timelineLocators}>
          <div
            className={styles.loop}
            style={{
              left: `${props.converter.convertLocation(props.loopStart) * props.scale}rem`,
              width: `${
                props.converter.convertDurationAtLocation(
                  props.loopStart.diff(props.loopEnd, props.timeSignature),
                  props.loopStart,
                ) * props.scale
              }rem`,
              backgroundColor: props.looping ? 'rgba(0, 0, 0, 0.25)' : undefined,
            }}
          >
            <svg
              className={styles.locator}
              style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <polygon points="0,0 10,5 0,10" fill="black" />
            </svg>
            <svg
              className={styles.locator}
              style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
              width="10"
              height="10"
              viewBox="0 0 10 10"
            >
              <polygon points="0,5 10,0 10,10" fill="black" />
            </svg>
          </div>
          <svg
            className={styles.locator}
            style={{
              position: 'absolute',
              left: `${props.converter.convertLocation(props.end) * props.scale}rem`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              // border: '1px solid black',
            }}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            onPointerDown={onMouseDownEnd}
            onPointerMove={onMouseMoveEnd}
            onPointerUp={onMouseUpEnd}
          >
            <line x1="0" y1="0" x2="10" y2="0" stroke="black" strokeWidth="2" />
            <polygon points="0,2 10,2 5,10" fill="black" />
          </svg>
        </div>
        <div className={styles.timelineRuler}>
          <div>
            {Array.from(labelIterator).map((location) => {
              return (
                <div
                  className={styles.timelineMajorTick}
                  style={{ left: `${props.converter.convertLocation(location) * props.scale}rem` }}
                >
                  <div className={styles.timelineTickLabel}>{settings.label(location)}</div>
                </div>
              );
            })}
          </div>
          <div>
            {Array.from(tickIterator).map((location) => {
              return (
                <div
                  className={styles.timelineTick}
                  style={{ left: `${props.converter.convertLocation(location) * props.scale}rem` }}
                >
                  &nbsp;
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

import { FunctionComponent } from 'react';

import styles from './Timeline.module.css';
import { Duration, Location, LocationToTime, TimeSignature } from '../core/Common';
import { PPQN } from '../core/Config';

export interface TimelineProps {
  start: number;
  scale: number;
  converter: LocationToTime;
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
  const rangeEnd = new Location(16, 1, 1);
  const signature = new TimeSignature(4, 4);

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

  const labelIterator = new TimelineGenerator(
    rangeStart,
    rangeEnd,
    settings.majorStep,
    new TimeSignature(4, 4),
  );

  const tickIterator = new TimelineGenerator(
    rangeStart,
    rangeEnd,
    settings.minorStep,
    new TimeSignature(4, 4),
  );

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineFront}>&nbsp;</div>
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
  );
};

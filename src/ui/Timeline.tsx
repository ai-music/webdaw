import { FunctionComponent } from 'react';

import styles from './Timeline.module.css';
import { Duration, Location, LocationToTime, TimeSignature } from '../core/Common';

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
    const done = this.current.compare(this.end) >= 0;

    const result = {
      done: done,
      value: this.current,
    };

    this.current = this.current.add(this.step, this.signature);

    return result;
  }
}

// A timeline component across the top of the arrangement view.
// It needs to be aligned with the actual track content visualizations and
// provides UX interactions for positioning of the playback head and the zoom level.
// The Timeline also visualizes the locator positions, loop mode, and the current
// position of the playback head.
export const Timeline: FunctionComponent<TimelineProps> = (props: TimelineProps) => {
  const labelIterator = new TimelineGenerator(
    new Location(1, 1, 1),
    new Location(16, 1, 1),
    new Duration(1, 0, 0),
    new TimeSignature(4, 4),
  );

  const tickIterator = new TimelineGenerator(
    new Location(1, 1, 1),
    new Location(16, 1, 1),
    new Duration(0, 1, 0),
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
                style={{ left: `${props.converter.convertLocation(location) * 4}rem` }}
              >
                <div className={styles.timelineTickLabel}>{location.bar}</div>
              </div>
            );
          })}
        </div>
        <div>
          {Array.from(tickIterator).map((location) => {
            return (
              <div
                className={styles.timelineTick}
                style={{ left: `${props.converter.convertLocation(location) * 4}rem` }}
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

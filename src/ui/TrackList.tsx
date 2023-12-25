import { FunctionComponent, useEffect, useState } from 'react';

import { Track } from './Track';
import { Colors } from '@blueprintjs/core';

import styles from './TrackList.module.css';
import { TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';
import { PlaybackPositionEvent } from '../core/Events';
import { Engine } from '../core/Engine';
import { Properties } from '@blueprintjs/icons';

interface Properties extends TimelineProps {
  tracks: TrackInterface[];
  engine: Engine;
}

export const TrackList: FunctionComponent<Properties> = ({
  start,
  scale,
  tracks,
  engine,
  timestamp,
}) => {
  return (
    <div className={styles.trackList}>
      {tracks.map((track, index) => (
        <Track
          track={track}
          index={index}
          start={start}
          scale={scale}
          converter={engine.project.locationToTime}
        />
      ))}
      <div className={styles.markerArea} style={{ gridRow: `1 / span ${styles.trackList.length}` }}>
        <div className={styles.marker} style={{ left: `${timestamp * scale}rem` }}></div>
      </div>
    </div>
  );
};

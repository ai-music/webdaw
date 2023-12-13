import { FunctionComponent, useEffect, useState } from 'react';

import { Track } from './Track';
import { Colors } from '@blueprintjs/core';

import styles from './TrackList.module.css';
import { TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';
import { PlaybackPositionEvent } from '../core/Events';
import { Engine } from '../core/Engine';

interface Properties extends TimelineProps {
  tracks: TrackInterface[];
  engine: Engine;
}

export const TrackList: FunctionComponent<Properties> = ({ start, scale, tracks, engine }) => {
  const [timestamp, setTimestamp] = useState(0); // [hh, mm, ss, uuuu]

  const positionEventHandler = (event: PlaybackPositionEvent) => {
    setTimestamp(event.timestamp);
  };

  useEffect(() => {
    engine.registerPlaybackPositionEventHandler(positionEventHandler);
    return () => {
      engine.unregisterPlaybackPositionEventHandler(positionEventHandler);
    };
  }, []);

  return (
    <div className={styles.trackList}>
      {tracks.map((track, index) => (
        <Track
          track={track}
          index={index}
          start={start}
          scale={scale}
          resolver={engine.project.locationToTimeConverter()}
        />
      ))}
      <div className={styles.markerArea} style={{ gridRow: `1 / span ${styles.trackList.length}` }}>
        <div className={styles.marker} style={{ left: `${timestamp * 4}rem` }}></div>
      </div>
    </div>
  );
};

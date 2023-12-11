import { FunctionComponent } from 'react';

import { Track } from './Track';
import { Colors } from '@blueprintjs/core';

import styles from './TrackList.module.css';
import { TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';

interface Properties extends TimelineProps {
  tracks: TrackInterface[];
}

export const TrackList: FunctionComponent<Properties> = ({ start, scale, tracks }) => {
  // const tracks_ = [
  //   {
  //     name: 'Kick',
  //     color: Colors.RED5,
  //     regions: [
  //       { name: 'Kick 1', color: Colors.RED5, begin: 0, length: 8 },
  //       { name: 'Kick 2', color: Colors.RED5, begin: 10, length: 4 },
  //       { name: 'Kick 3', color: Colors.RED5, begin: 16, length: 8 },
  //       { name: 'Kick 4', color: Colors.RED5, begin: 26, length: 8 },
  //     ],
  //   },
  //   {
  //     name: 'Snare',
  //     color: Colors.BLUE5,
  //     regions: [
  //       { name: 'Snare 1', color: Colors.BLUE5, begin: 4, length: 4 },
  //       { name: 'Snare 2', color: Colors.BLUE5, begin: 20, length: 4 },
  //       { name: 'Snare 3', color: Colors.BLUE5, begin: 26, length: 8 },
  //     ],
  //   },
  //   {
  //     name: 'Hi-Hat',
  //     color: Colors.GREEN5,
  //     regions: [
  //       { name: 'Hi-Hat 1', color: Colors.GREEN5, begin: 0, length: 8 },
  //       { name: 'Hi-Hat 2', color: Colors.GREEN5, begin: 10, length: 4 },
  //       { name: 'Hi-Hat 3', color: Colors.GREEN5, begin: 16, length: 8 },
  //       { name: 'Hi-Hat 4', color: Colors.GREEN5, begin: 26, length: 8 },
  //     ],
  //   },
  //   {
  //     name: 'Bass',
  //     color: Colors.GOLD5,
  //     regions: [{ name: 'Bass 1', color: Colors.GOLD5, begin: 0, length: 34 }],
  //   },
  //   {
  //     name: 'Lead',
  //     color: Colors.ORANGE5,
  //     regions: [
  //       { name: 'Lead 1', color: Colors.ORANGE5, begin: 0, length: 8 },
  //       { name: 'Lead 2', color: Colors.ORANGE5, begin: 16, length: 8 },
  //     ],
  //   },
  //   {
  //     name: 'Pad',
  //     color: Colors.VIOLET5,
  //     regions: [{ name: 'Pad 1', color: Colors.VIOLET5, begin: 0, length: 34 }],
  //   },
  // ];

  // Vertically scrollable list of tracks
  return (
    <div className={styles.tracklist}>
      {tracks.map((track, index) => (
        <Track track={track} index={index} start={start} scale={scale} />
      ))}
    </div>
  );
};

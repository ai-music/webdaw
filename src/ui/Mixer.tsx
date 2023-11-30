import { FunctionComponent } from 'react';

import { Bus, Channel, ChannelProps } from './Channel';

import styles from './Mixer.module.css';
import { Colors } from '@blueprintjs/core';

export const Mixer: FunctionComponent = () => {
  const buses: Bus[] = [
    { name: 'Reverb', color: Colors.GRAY5 },
    { name: 'Delay', color: Colors.GRAY5 },
  ];

  const channels = [
    { name: 'Kick', color: Colors.RED5 },
    { name: 'Snare', color: Colors.BLUE5 },
    { name: 'Hi-Hat', color: Colors.GREEN5 },
    { name: 'Bass', color: Colors.GOLD5 },
    { name: 'Lead', color: Colors.ORANGE5 },
    { name: 'Pad', color: Colors.VIOLET5 },
  ];

  // Horizontal scroll view of Channels
  return (
    <div className={styles.mixer}>
      {channels.map((channel, index) => (
        <Channel {...channel} index={index} buses={buses} />
      ))}
    </div>
  );
};

import { FunctionComponent } from 'react';

export interface TimelineProps {
  start: number;
  scale: number;
}

// A timeline component across the top of the arrangement view.
// It needs to be aligned with the actual track content visualizations and
// provides UX interactions for positioning of the playback head and the zoom level.
// The Timeline also visualizes the locator positions, loop mode, and the current
// position of the playback head.
export const Timeline: FunctionComponent<TimelineProps> = (props: TimelineProps) => {
  return <div>Timeline</div>;
};

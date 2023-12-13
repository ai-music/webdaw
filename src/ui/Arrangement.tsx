import { FunctionComponent, useState } from 'react';

import { TrackList } from './TrackList';
import { Timeline } from './Timeline';
import { TrackInterface } from '../core/Track';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';

export type ArrangementProps = {
  project: ProjectObj;
  engine: Engine;
};

export const Arrangement: FunctionComponent<ArrangementProps> = (props) => {
  // Vertical stack of GlobalAutomation and TrackList
  // Also should have timeline and timeline zoom controls along the top
  // In addition, there is an overlay layer where the current playback location is
  // drawn across all tracks.

  const [timelineStart, setTimelineStart] = useState(0);
  const [timelineScale, setTimelineScale] = useState(2);

  return (
    <>
      <Timeline start={timelineStart} scale={timelineScale} />
      <TrackList start={timelineStart} scale={timelineScale} tracks={props.project.tracks} />
    </>
  );
};

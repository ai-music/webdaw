import { FunctionComponent, useState } from 'react';

import { TrackList } from './TrackList';
import { Timeline } from './Timeline';
import { TrackInterface } from '../core/Track';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';
import { Project } from './Project';

export type ArrangementProps = {
  project: ProjectObj;
  engine: Engine;
  timelineScale: number;
};

export const Arrangement: FunctionComponent<ArrangementProps> = (props) => {
  // Vertical stack of GlobalAutomation and TrackList
  // Also should have timeline and timeline zoom controls along the top
  // In addition, there is an overlay layer where the current playback location is
  // drawn across all tracks.

  const [timelineStart, setTimelineStart] = useState(0);

  return (
    <>
      <Timeline
        start={timelineStart}
        scale={props.timelineScale}
        timeSignature={props.project.timeSignature}
        converter={props.project.locationToTime}
        loopStart={props.project.loopStart}
        loopEnd={props.project.loopEnd}
        end={props.project.end}
        looping={props.engine.looping}
      />
      <TrackList
        start={timelineStart}
        scale={props.timelineScale}
        timeSignature={props.project.timeSignature}
        tracks={props.project.tracks}
        engine={props.engine}
        converter={props.project.locationToTime}
        loopStart={props.project.loopStart}
        loopEnd={props.project.loopEnd}
        end={props.project.end}
        looping={props.engine.looping}
      />
    </>
  );
};

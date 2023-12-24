import { FunctionComponent, useEffect, useState } from 'react';

import { Transport } from './Transport';
import { Mixer } from './Mixer';
import { Location as LocationValue } from '../core/Common';
import { Button, ButtonGroup, Drawer, Section, SectionCard } from '@blueprintjs/core';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';
import { TrackList } from './TrackList';
import { Timeline } from './Timeline';
import { PlaybackPositionEvent, TransportEventType } from '../core/Events';

export type ProjectProps = {
  project: ProjectObj;
  engine: Engine;
  mixerVisible: boolean;
  setMixerVisible: (visible: boolean) => void;
};

export const Project: FunctionComponent<ProjectProps> = (props) => {
  const [timelineScale, setTimelineScale] = useState(4);
  const [timelineStart, setTimelineStart] = useState(0);

  const [timestamp, setTimestamp] = useState(0); // [hh, mm, ss, uuuu]
  const [current, setCurrent] = useState(new LocationValue(1, 1, 1));

  const [loopStart, setLoopStart] = useState(props.project.loopStart);
  const [loopEnd, setLoopEnd] = useState(props.project.loopEnd);
  const [end, setEnd] = useState(props.project.end);

  const changeCurrent = (location: LocationValue) => {
    setCurrent(location);
    props.engine.handleTransportEvent({
      type: TransportEventType.PositionChanged,
      location: location,
    });
  };

  const changeLoopStart = (location: LocationValue) => {
    setLoopStart(location);
    props.project.loopStart = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.LoopStartLocatorChanged,
      location: location,
    });
  };

  const changeLoopEnd = (location: LocationValue) => {
    setLoopEnd(location);
    props.project.loopEnd = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.LoopEndLocatorChanged,
      location: location,
    });
  };

  const changeEnd = (location: LocationValue) => {
    setEnd(location);
    props.project.end = location;
    props.engine.handleTransportEvent({
      type: TransportEventType.PlaybackEndLocatorChanged,
      location: location,
    });
  };

  const positionEventHandler = (event: PlaybackPositionEvent) => {
    setCurrent(event.location);
    setTimestamp(event.timestamp);
  };

  useEffect(() => {
    setLoopStart(props.project.loopStart);
    setLoopEnd(props.project.loopEnd);
    setEnd(props.project.end);
  }, [props.project]);

  useEffect(() => {
    props.engine.registerPlaybackPositionEventHandler(positionEventHandler);
    return () => {
      props.engine.unregisterPlaybackPositionEventHandler(positionEventHandler);
    };
  }, [props.engine]);

  // const [infoPanelVisible, setInfoPanelVisible] = useState(false);

  // TODO: Need to add buttons to the toolbar to show/hide the Browser and InfoPanel
  //
  // Browser to the left, InfoPanel to the right, in the center stack of Arrangement, Editor
  return (
    <>
      <Transport
        engine={props.engine}
        project={props.project}
        timelineScale={timelineScale}
        setTimelineScale={setTimelineScale}
        timestamp={timestamp}
        setTimestamp={setTimestamp}
        current={current}
        setCurrent={changeCurrent}
        loopStart={loopStart}
        setLoopStart={changeLoopStart}
        loopEnd={loopEnd}
        setLoopEnd={changeLoopEnd}
        end={end}
        setEnd={changeEnd}
      />
      <div>
        <Timeline
          start={timelineStart}
          scale={timelineScale}
          timeSignature={props.project.timeSignature}
          converter={props.project.locationToTime}
          loopStart={loopStart}
          setLoopStart={changeLoopStart}
          loopEnd={loopEnd}
          setLoopEnd={changeLoopEnd}
          end={end}
          setEnd={changeEnd}
          looping={props.engine.looping}
        />
        <TrackList
          start={timelineStart}
          scale={timelineScale}
          timeSignature={props.project.timeSignature}
          tracks={props.project.tracks}
          engine={props.engine}
          converter={props.project.locationToTime}
          loopStart={loopStart}
          setLoopStart={changeLoopStart}
          loopEnd={loopEnd}
          setLoopEnd={changeLoopEnd}
          end={end}
          setEnd={changeEnd}
          looping={props.engine.looping}
        />
        <Drawer
          isOpen={props.mixerVisible}
          onClose={() => props.setMixerVisible(false)}
          canOutsideClickClose={false}
          icon="settings"
          position="bottom"
          size="75%"
          title="Mixer"
          usePortal={false}
        >
          <Mixer />
        </Drawer>
      </div>
    </>
  );
};

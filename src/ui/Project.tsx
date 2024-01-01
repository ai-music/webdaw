import { FunctionComponent, useEffect, useState } from 'react';

import { Transport } from './Transport';
import { Mixer } from './Mixer';
import { Duration, Location as LocationValue } from '../core/Common';
import { Drawer } from '@blueprintjs/core';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';
import { PlaybackPositionEvent, TransportEventType } from '../core/Events';
import { Arrangement } from './Arrangement';
import { TIMELINE_FACTOR_PX, TRACK_HEIGHT_PX } from './Config';

export type ProjectProps = {
  project: ProjectObj;
  engine: Engine;
  mixerVisible: boolean;
  setMixerVisible: (visible: boolean) => void;
};

export const Project: FunctionComponent<ProjectProps> = (props) => {
  const [timelineScale, setTimelineScale] = useState(4);

  const [timestamp, setTimestamp] = useState(0); // [hh, mm, ss, uuuu]
  const [current, setCurrent] = useState(new LocationValue(1, 1, 1));

  const [loopStart, setLoopStart] = useState(props.project.loopStart);
  const [loopEnd, setLoopEnd] = useState(props.project.loopEnd);
  const [end, setEnd] = useState(props.project.end);

  const [looping, setLooping] = useState(props.engine.looping);

  const changeLooping = (looping: boolean) => {
    setLooping(looping);
    props.engine.handleTransportEvent({
      type: TransportEventType.LoopingChanged,
      looping: looping,
    });
  };

  const changeTimestamp = (timestamp: number) => {
    const position = props.project.locationToTime.convertTime(timestamp);
    setCurrent(position);
    props.project.current = position;
    setTimestamp(timestamp);
    props.engine.handleTransportEvent({
      type: TransportEventType.PositionChanged,
      location: position,
    });
  };

  const changeCurrent = (location: LocationValue) => {
    const timestamp = props.project.locationToTime.convertLocation(location);
    setCurrent(location);
    props.project.current = location;
    setTimestamp(timestamp);
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
    props.project.current = event.location;
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

  const timelineRange = props.project.end.add(new Duration(1, 0, 0), props.project.timeSignature);
  const totalWidth =
    props.project.locationToTime.convertLocation(timelineRange) *
    timelineScale *
    TIMELINE_FACTOR_PX;

  // const [infoPanelVisible, setInfoPanelVisible] = useState(false);

  // TODO: Need to add buttons to the toolbar to show/hide the Browser and InfoPanel
  //
  // Browser to the left, InfoPanel to the right, in the center stack of Arrangement, Editor
  return (
    <>
      <Transport
        engine={props.engine}
        project={props.project}
        totalWidth={totalWidth}
        timelineScale={timelineScale}
        setTimelineScale={setTimelineScale}
        timestamp={timestamp}
        setTimestamp={changeTimestamp}
        current={current}
        setCurrent={changeCurrent}
        loopStart={loopStart}
        setLoopStart={changeLoopStart}
        loopEnd={loopEnd}
        setLoopEnd={changeLoopEnd}
        end={end}
        setEnd={changeEnd}
        looping={looping}
        setLooping={changeLooping}
      />
      <Arrangement
        tracks={props.project.tracks}
        totalWidth={totalWidth}
        totalHeight={props.project.tracks.length * TRACK_HEIGHT_PX}
        scale={timelineScale}
        timeSignature={props.project.timeSignature}
        converter={props.project.locationToTime}
        timestamp={timestamp}
        setTimestamp={changeTimestamp}
        current={current}
        setCurrent={changeCurrent}
        loopStart={loopStart}
        setLoopStart={changeLoopStart}
        loopEnd={loopEnd}
        setLoopEnd={changeLoopEnd}
        end={end}
        setEnd={changeEnd}
        looping={looping}
        setLooping={changeLooping}
      />
      <div>
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

import { FunctionComponent, useContext, useEffect, useRef, useState } from 'react';

import { Transport } from './Transport';
import { Mixer } from './Mixer';
import { Duration, Location as LocationValue } from '../core/Common';
import { Drawer } from '@blueprintjs/core';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';
import { PlaybackPositionEvent, TrackEventType, TransportEventType } from '../core/Events';
import { Arrangement } from './Arrangement';
import {
  BROWSER_WIDTH_INITIAL,
  BROWSER_WIDTH_MAX,
  BROWSER_WIDTH_MIN,
  TIMELINE_FACTOR_PX,
  TRACK_HEIGHT_PX,
} from './Config';
import { AudioTrack } from '../core/AudioTrack';
import { AbstractTrack, TrackInterface } from '../core/Track';

import styles from './Project.module.css';
import { Browser } from './Browser';
import { EngineContext } from './Context';

export type ProjectProps = {
  project: ProjectObj;
  tracks: TrackInterface[];
  setTracks: (tracks: AbstractTrack[]) => void;
  mixerVisible: boolean;
  setMixerVisible: (visible: boolean) => void;
  browserVisible: boolean;
  setBrowserVisible: (visible: boolean) => void;
};

export const Project: FunctionComponent<ProjectProps> = (props) => {
  const engine = useContext(EngineContext)!;

  const [timelineScale, setTimelineScale] = useState(4);

  const [timestamp, setTimestamp] = useState(0); // [hh, mm, ss, uuuu]
  const [current, setCurrent] = useState(new LocationValue(1, 1, 1));

  const [loopStart, setLoopStart] = useState(props.project.loopStart);
  const [loopEnd, setLoopEnd] = useState(props.project.loopEnd);
  const [end, setEnd] = useState(props.project.end);

  const [looping, setLooping] = useState(engine.looping);

  function moveTrackToPosition(index: number, position: number) {
    props.project.moveTrackToPosition(index, position);
    props.setTracks(props.project.tracks);
  }

  function deleteTrack(index: number) {
    engine.handleTrackEvent({
      type: TrackEventType.Removed,
      track: props.project.tracks[index],
    });

    props.project.deleteTrack(index);
    props.setTracks(props.project.tracks);
  }

  function appendTrack(trackType: string) {
    if (trackType === 'audio') {
      const track = new AudioTrack();
      props.project.appendTrack(track);

      engine.handleTrackEvent({
        type: TrackEventType.Added,
        track: track,
      });

      props.setTracks(props.project.tracks);
    }
  }

  const changeLooping = (looping: boolean) => {
    setLooping(looping);
    engine.handleTransportEvent({
      type: TransportEventType.LoopingChanged,
      looping: looping,
    });
  };

  const changeTimestamp = (timestamp: number) => {
    const position = props.project.locationToTime.convertTime(timestamp);
    setCurrent(position);
    props.project.current = position;
    setTimestamp(timestamp);
    engine.handleTransportEvent({
      type: TransportEventType.PositionChanged,
      location: position,
    });
  };

  const changeCurrent = (location: LocationValue) => {
    const timestamp = props.project.locationToTime.convertLocation(location);
    setCurrent(location);
    props.project.current = location;
    setTimestamp(timestamp);
    engine.handleTransportEvent({
      type: TransportEventType.PositionChanged,
      location: location,
    });
  };

  const changeLoopStart = (location: LocationValue) => {
    setLoopStart(location);
    props.project.loopStart = location;
    engine.handleTransportEvent({
      type: TransportEventType.LoopStartLocatorChanged,
      location: location,
    });
  };

  const changeLoopEnd = (location: LocationValue) => {
    setLoopEnd(location);
    props.project.loopEnd = location;
    engine.handleTransportEvent({
      type: TransportEventType.LoopEndLocatorChanged,
      location: location,
    });
  };

  const changeEnd = (location: LocationValue) => {
    setEnd(location);
    props.project.end = location;
    engine.handleTransportEvent({
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
    engine.registerPlaybackPositionEventHandler(positionEventHandler);
    return () => {
      engine.unregisterPlaybackPositionEventHandler(positionEventHandler);
    };
  }, [engine]);

  const timelineRange = props.project.end.add(new Duration(1, 0, 0), props.project.timeSignature);
  const totalWidth =
    props.project.locationToTime.convertLocation(timelineRange) *
    timelineScale *
    TIMELINE_FACTOR_PX;

  const [browserWidth, setBrowserWidth] = useState(BROWSER_WIDTH_INITIAL);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(0);
  const dragStartWidth = useRef(0);
  const dragTarget = useRef<HTMLElement | null>(null);

  function onBeginDragSeparator(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging && dragTarget.current === null) {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragTarget.current = event.currentTarget;
      dragStart.current = event.clientX;
      dragStartWidth.current = browserWidth;
      setIsDragging(true);
    }
  }
  function onDragSeparator(event: React.PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      const delta = event.clientX - dragStart.current;
      const newWidth = Math.min(
        Math.max(dragStartWidth.current + delta, BROWSER_WIDTH_MIN),
        BROWSER_WIDTH_MAX,
      );

      if (newWidth !== browserWidth) {
        setBrowserWidth(newWidth);
      }
    }
  }

  function onEndDragSeparator(event: React.PointerEvent<HTMLDivElement>) {
    if (isDragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      const delta = event.clientX - dragStart.current;
      const newWidth = Math.min(
        Math.max(dragStartWidth.current + delta, BROWSER_WIDTH_MIN),
        BROWSER_WIDTH_MAX,
      );

      if (newWidth !== browserWidth) {
        setBrowserWidth(newWidth);
      }

      dragTarget.current = null;
      setIsDragging(false);
    }
  }

  //
  // Browser to the left, InfoPanel to the right, in the center stack of Arrangement, Editor
  return (
    <>
      <Transport
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
      <div className={styles.center}>
        {props.browserVisible && (
          <>
            <div
              className={styles.browser}
              style={{
                width: `${browserWidth}px`,
                minWidth: `${browserWidth}px`,
                maxWidth: `${browserWidth}px`,
              }}
            >
              <div className={styles.browserInner}>
                <Browser />
              </div>
            </div>
            <div
              className={styles.separator}
              onPointerDown={onBeginDragSeparator}
              onPointerMove={onDragSeparator}
              onPointerUp={onEndDragSeparator}
            />
          </>
        )}

        <Arrangement
          tracks={props.tracks}
          updateTrackEnablement={() => props.project.updateTrackEnablement()}
          appendTrack={appendTrack}
          moveTrackToPosition={moveTrackToPosition}
          deleteTrack={deleteTrack}
          totalWidth={totalWidth}
          totalHeight={(props.tracks.length + 1) * TRACK_HEIGHT_PX}
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
      </div>
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

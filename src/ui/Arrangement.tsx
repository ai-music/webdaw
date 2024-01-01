import { FunctionComponent, UIEvent as ReactUIEvent, useRef, useState } from 'react';

import styles from './Arrangement.module.css';
import { Timeline, TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';
import { TrackInfo } from './TrackInfo';
import { Region } from './Region';

/**
 * Properties required to render the Arrangement component.
 */
export interface ArrangementProps extends TimelineProps {
  tracks: TrackInterface[];
  totalWidth: number;
  totalHeight: number;
}

/**
 * Arrangement component.
 *
 * The arrangement is the main view of the project. It contains the timeline and
 * the list of tracks within a 2D-scrollable area. Scrolling across timeline,
 * track info and track content is synchronized.
 */
export const Arrangement: FunctionComponent<ArrangementProps> = (props: ArrangementProps) => {
  const timelineScroll = useRef<HTMLDivElement>(null);
  const trackScroll = useRef<HTMLDivElement>(null);
  const regionScroll = useRef<HTMLDivElement>(null);

  const debounce = useRef(false);
  const lastRegionScrollTop = useRef(0);
  const lastRegionScrollLeft = useRef(0);

  const onScrollTimeline = (e: ReactUIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLDivElement;

    if (debounce.current) {
      debounce.current = false;
      return;
    }

    debounce.current = true;
    regionScroll.current!.scrollLeft = target.scrollLeft;
  };

  const onScrollTracks = (e: ReactUIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLDivElement;

    if (debounce.current) {
      debounce.current = false;
      return;
    }

    debounce.current = true;
    regionScroll.current!.scrollTop = target.scrollTop;
  };

  const onScrollRegions = (e: ReactUIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLDivElement;

    if (debounce.current) {
      debounce.current = false;
      return;
    }

    if (target.scrollTop !== lastRegionScrollTop.current) {
      debounce.current = true;
      trackScroll.current!.scrollTop = target.scrollTop;
      lastRegionScrollTop.current = target.scrollTop;
    }

    if (target.scrollLeft !== lastRegionScrollLeft.current) {
      debounce.current = true;
      timelineScroll.current!.scrollLeft = target.scrollLeft;
      lastRegionScrollLeft.current = target.scrollLeft;
    }
  };

  const tracks = props.tracks;

  return (
    <div className={styles.arrangement}>
      <div className={styles.timelineRow}>
        <div className={styles.placeholder} />
        <div ref={timelineScroll} className={styles.timelineScroll} onScroll={onScrollTimeline}>
          <div
            className={styles.timelineArea}
            style={{
              width: props.totalWidth,
              minWidth: props.totalWidth,
              maxWidth: props.totalWidth,
            }}
          >
            <Timeline {...props} />
          </div>
        </div>
      </div>
      <div className={styles.tracks}>
        <div ref={trackScroll} className={styles.trackScroll} onScroll={onScrollTracks}>
          <div
            style={{
              height: props.totalHeight,
              minHeight: props.totalHeight,
              maxHeight: props.totalHeight,
            }}
          >
            {tracks.map((track, index) => (
              <TrackInfo index={index} name={track.name} color={track.color} />
            ))}
          </div>
        </div>
        <div ref={regionScroll} className={styles.regionScroll} onScroll={onScrollRegions}>
          <div
            style={{
              height: props.totalHeight,
              minHeight: props.totalHeight,
              maxHeight: props.totalHeight,
              width: props.totalWidth,
              minWidth: props.totalWidth,
              maxWidth: props.totalWidth,
              position: 'relative',
              // backgroundColor: 'lightgray',
            }}
          >
            {tracks.map((track, index) =>
              track.regions.map((region) => (
                <Region
                  trackIndex={index}
                  region={region}
                  scale={props.scale}
                  converter={props.converter}
                />
              )),
            )}
            <div
              className={styles.marker}
              style={{ left: `${props.timestamp * props.scale}rem` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

{
  /* <Timeline
          start={timelineStart}
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
        <TrackList
          start={timelineStart}
          scale={timelineScale}
          timeSignature={props.project.timeSignature}
          tracks={props.project.tracks}
          engine={props.engine}
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
        /> */
}

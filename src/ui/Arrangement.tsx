import { FunctionComponent, UIEvent as ReactUIEvent, useRef, useState } from 'react';

import styles from './Arrangement.module.css';
import { Timeline, TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';
import { TrackInfo } from './TrackInfo';
import { Region } from './Region';
import { SCROLLBAR_DIMENSIONS_PX, TIMELINE_FACTOR_PX } from './Config';

/**
 * Properties required to render the Arrangement component.
 */
export interface ArrangementProps extends TimelineProps {
  tracks: TrackInterface[];
  updateTrackEnablement: () => void;
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
        <div
          id="timelineScroll"
          ref={timelineScroll}
          className={styles.timelineScroll}
          onScroll={onScrollTimeline}
        >
          <div
            className={styles.timelineArea}
            style={{
              width: `${props.totalWidth}px`,
              minWidth: `${props.totalWidth}px`,
              maxWidth: `${props.totalWidth}px`,
              overflow: 'hidden',
            }}
          >
            <Timeline {...props} />
          </div>
        </div>
        <div
          style={{ width: SCROLLBAR_DIMENSIONS_PX, minWidth: SCROLLBAR_DIMENSIONS_PX, flex: 0 }}
        />
      </div>
      <div className={styles.tracks}>
        <div className={styles.trackScrollOuter}>
          <div ref={trackScroll} className={styles.trackScroll} onScroll={onScrollTracks}>
            <div
              style={{
                height: `${props.totalHeight}px`,
                minHeight: `${props.totalHeight}px`,
                maxHeight: `${props.totalHeight}px`,
              }}
            >
              {tracks.map((track, index) => (
                <TrackInfo
                  index={index}
                  track={track}
                  updateTrackEnablement={props.updateTrackEnablement}
                />
              ))}
            </div>
          </div>
          <div
            style={{ height: SCROLLBAR_DIMENSIONS_PX, minHeight: SCROLLBAR_DIMENSIONS_PX, flex: 0 }}
          />
        </div>
        <div ref={regionScroll} className={styles.regionScroll} onScroll={onScrollRegions}>
          <div
            style={{
              height: `${props.totalHeight}px`,
              minHeight: `${props.totalHeight}px`,
              maxHeight: `${props.totalHeight}px`,
              width: `${props.totalWidth}px`,
              minWidth: `${props.totalWidth}px`,
              maxWidth: `${props.totalWidth}px`,
              position: 'relative',
              overflow: 'hidden',
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
              style={{ left: `${props.timestamp * props.scale * TIMELINE_FACTOR_PX}px` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

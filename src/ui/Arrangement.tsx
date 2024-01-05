import { FunctionComponent, UIEvent as ReactUIEvent, useRef, useState } from 'react';

import styles from './Arrangement.module.css';
import { Timeline, TimelineProps } from './Timeline';
import { TrackInterface } from '../core/Track';
import { TrackInfo } from './TrackInfo';
import { Region } from './Region';
import {
  REGION_AREA_ID,
  REGION_HEIGHT_PX,
  REGION_PLACEHOLDER_ID,
  REGION_SCROLL_VIEW_ID,
  SCROLLBAR_DIMENSIONS_PX,
  TIMELINE_FACTOR_PX,
  TRACK_HEIGHT_PX,
} from './Config';
import { Button, ButtonGroup } from '@blueprintjs/core';

/**
 * Properties required to render the Arrangement component.
 */
export interface ArrangementProps extends TimelineProps {
  tracks: TrackInterface[];
  updateTrackEnablement: () => void;
  appendTrack: (trackType: string) => void;
  moveTrackToPosition: (index: number, position: number) => void;
  deleteTrack: (index: number) => void;
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

  const [colorChangeTracker, setColorChangeTracker] = useState(0);

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

  const [isDragging, setIsDragging] = useState(false);
  const [dragBarIndex, setDragBarIndex] = useState(0);
  const dragStart = useRef(0);
  const dragStartIndex = useRef(0);
  const dragTarget = useRef<HTMLElement | null>(null);

  function onDragTrackStart(event: React.PointerEvent<HTMLElement>, index: number) {
    if (!isDragging && dragTarget.current === null) {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragTarget.current = event.currentTarget;
      dragStart.current = event.clientY;
      dragStartIndex.current = index;
      setIsDragging(true);
      setDragBarIndex(index);
    }
  }
  function onDragTrack(event: React.PointerEvent<HTMLElement>, index: number) {
    if (isDragging) {
      const delta = event.clientY - dragStart.current;
      const newIndex = Math.min(
        Math.max(dragStartIndex.current + Math.round(delta / TRACK_HEIGHT_PX), 0),
        props.tracks.length,
      );

      if (newIndex !== dragBarIndex) {
        setDragBarIndex(newIndex);
      }
    }
  }

  function onDragTrackEnd(event: React.PointerEvent<HTMLElement>, index: number) {
    if (isDragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      const delta = event.clientY - dragStart.current;
      const newIndex = Math.min(
        Math.max(dragStartIndex.current + Math.round(delta / TRACK_HEIGHT_PX), 0),
        props.tracks.length,
      );

      if (newIndex !== index || newIndex !== index + 1) {
        props.moveTrackToPosition(index, newIndex);
      }

      dragTarget.current = null;
      setIsDragging(false);
    }
  }

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
                position: 'relative',
                height: `${props.totalHeight}px`,
                minHeight: `${props.totalHeight}px`,
                maxHeight: `${props.totalHeight}px`,
              }}
            >
              {props.tracks.map((track, index) => (
                <div
                  className={`${styles.trackInfoBox} ${
                    isDragging && index === dragStartIndex.current ? styles.dragging : ''
                  }`}
                >
                  <i
                    className={styles.grip}
                    style={{
                      color: track.color,
                      textShadow: `0px -4px 0px ${track.color}`,
                    }}
                    onPointerDown={(e) => onDragTrackStart(e, index)}
                    onPointerMove={(e) => onDragTrack(e, index)}
                    onPointerUp={(e) => onDragTrackEnd(e, index)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                  ></i>
                  <TrackInfo
                    delete={() => props.deleteTrack(index)}
                    colorChange={(color) => {
                      setColorChangeTracker(colorChangeTracker + 1);
                    }}
                    index={index}
                    track={track}
                    updateTrackEnablement={props.updateTrackEnablement}
                  />
                </div>
              ))}
              <div
                className={styles.dragMarker}
                style={{
                  top: `${dragBarIndex * TRACK_HEIGHT_PX}px`,
                  display: isDragging ? 'inherit' : 'none',
                }}
              />
              <div
                className={styles.trackInfoPlaceholder}
                style={{ height: TRACK_HEIGHT_PX, lineHeight: `${TRACK_HEIGHT_PX}px` }}
              >
                <ButtonGroup>
                  <Button
                    icon="plus"
                    small
                    minimal
                    outlined={false}
                    onClick={() => props.appendTrack('audio')}
                  />
                </ButtonGroup>
              </div>
            </div>
          </div>
          <div
            style={{ height: SCROLLBAR_DIMENSIONS_PX, minHeight: SCROLLBAR_DIMENSIONS_PX, flex: 0 }}
          />
        </div>
        <div
          id={REGION_SCROLL_VIEW_ID}
          ref={regionScroll}
          className={styles.regionScroll}
          onScroll={onScrollRegions}
        >
          <div
            id={REGION_AREA_ID}
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
            {props.tracks.map((track, index) =>
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
              id={REGION_PLACEHOLDER_ID}
              className={styles.regionPlaceholder}
              style={{
                display: 'block',
                top: 2 * TRACK_HEIGHT_PX,
                left: 300,
                width: 200,
                position: 'absolute',
                height: REGION_HEIGHT_PX,
                lineHeight: `${TRACK_HEIGHT_PX}px`,
              }}
            />
            <div
              className={styles.trackPlaceholder}
              style={{
                height: TRACK_HEIGHT_PX,
                top: props.tracks.length * TRACK_HEIGHT_PX,
                lineHeight: `${TRACK_HEIGHT_PX}px`,
              }}
            >
              Drag a region here to create a new track
            </div>
            <div
              className={styles.marker}
              style={{ left: `${props.timestamp * props.scale * TIMELINE_FACTOR_PX}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

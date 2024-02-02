import { FunctionComponent, useEffect, useRef, useState } from 'react';

import styles from './Region.module.css';
import { RegionDataType, RegionInterface } from '../core/Region';
import { LocationToTime } from '../core/Common';
import {
  REGION_HEIGHT_PX,
  REGION_RENDERING_HEIGHT_PX,
  TIMELINE_FACTOR_PX,
  TRACK_HEIGHT_PX,
} from './Config';
import { AudioRegion } from '../core/AudioRegion';
import { EditableText } from '@blueprintjs/core';

export interface RegionProps {
  region: RegionInterface;
  trackIndex: number;
  scale: number;
  converter: LocationToTime;
}

function audioToImage(audioBuffer: AudioBuffer, width: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = REGION_RENDERING_HEIGHT_PX;
  drawAudioBuffer(audioBuffer, canvas);
  return canvas.toDataURL();
}

function drawAudioBuffer(audioBuffer: AudioBuffer, canvas: HTMLCanvasElement) {
  // ensure that the bufer is not empty
  if (!audioBuffer.length || !audioBuffer.duration) {
    return;
  }

  const duration = audioBuffer.duration;
  const context = canvas.getContext('2d')!;
  const data = audioBuffer.getChannelData(0);
  const bufferScale = audioBuffer.length / audioBuffer.duration;
  const endOffset = Math.min(duration * bufferScale, audioBuffer.length);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 2;
  context.strokeStyle = 'black';
  context.beginPath();
  const sliceWidth = canvas.width / (duration * bufferScale);
  let x = 0;
  for (let i = 0; i < endOffset; i++) {
    const v = data[i] / 2.0 + 0.5;
    const y = v * canvas.height;
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
    x += sliceWidth;
  }
  context.stroke();
}

/**
 * The state of the drag operation.
 */
enum DragState {
  None,
  Left,
  Right,
  Region,
  Loop,
}

export const Region: FunctionComponent<RegionProps> = (props: RegionProps) => {
  const [selected, setSelected] = useState(false);
  const [name, setName] = useState(props.region.name);

  const duration = props.converter.convertDurationAtLocation(
    props.region.length,
    props.region.position,
  );

  const scaleFactor = props.scale * TIMELINE_FACTOR_PX;
  const width = duration * scaleFactor;

  var audioImageOffset = 0;
  var audioImageWidth = 0;

  if (props.region.data.type === RegionDataType.Audio) {
    const audioRegion = props.region as AudioRegion;
    audioImageWidth = scaleFactor * audioRegion.audioFile.buffer.duration;
    audioImageOffset =
      scaleFactor *
      props.converter.convertDurationAtLocation(audioRegion.trim, audioRegion.position);
  }

  const style = {
    borderColor: props.region.color,
    width: `${width}px`,
    height: `${REGION_HEIGHT_PX}px`,
    left: `${props.converter.convertLocation(props.region.position) * props.scale}rem`,
    top: `${props.trackIndex * TRACK_HEIGHT_PX}px`,
    backgroundColor: selected ? props.region.color : 'transparent',
  };

  // TODO: retrieval should just be based on the scaleFactor.

  /**
   * Retrieve the image for the region at the given scale factor.
   *
   * @param scaleFactor conversion factor from seconds to pixels
   * @returns an image URL representing the region at the requested scale
   */
  function retrieveImage(scaleFactor: number): string {
    const cacheKey = scaleFactor;
    const cachedItem = props.region.cache[cacheKey];

    if (cachedItem) {
      return cachedItem;
    } else if (props.region.data.type === RegionDataType.Audio) {
      const audioBuffer = props.region.data.audioBuffer;
      const image = audioToImage(audioBuffer, scaleFactor * audioBuffer.duration);
      props.region.cache[cacheKey] = image;
      return image;
    } else {
      return '';
    }
  }

  const renderData = useRef<string>('');
  if (renderData.current === '' && props.region.data.type === RegionDataType.Audio) {
    console.log('rendering audio');
    renderData.current = retrieveImage(scaleFactor);
  }

  useEffect(() => {
    if (props.region.data.type === RegionDataType.Audio) {
      console.log('re-rendering audio');
      renderData.current = retrieveImage(scaleFactor);
    }
  }, [duration, props.scale, props.region.length]);

  function toggleSelection() {
    setSelected(!selected);
  }

  function changeName(name: string) {
    setName(name);
    props.region.name = name;
  }

  // Internal state variable to track the drag state.
  const dragState = useRef<DragState>(DragState.None);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);

  function onDragLeftStart(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.None) {
      dragState.current = DragState.Left;
      dragStartX.current = event.clientX;
      dragStartY.current = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onDragLeftMove(event: React.PointerEvent<HTMLDivElement>) {
    // for a non-looped region, the drag left gesture changes the start position within the
    // audio file that is being played back. At most, the start position can be moved to the
    // beginning of the audio file. I fmoved to the right, it can be moved at most to the
    // end of the audio file.
    // For a looped region, the drag left gesture changes the loop start position. That is,
    // maintaining the loop length and looping iterval, the loop start determines where playback
    // begins within the loop.
  }

  function onDragLeftEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.Left) {
      dragState.current = DragState.None;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onDragRightStart(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.None) {
      dragState.current = DragState.Right;
      dragStartX.current = event.clientX;
      dragStartY.current = event.clientY;
    }
  }

  function onDragRightMove(event: React.PointerEvent<HTMLDivElement>) {
    // for a non-looped region, the drag right gesture changes the end position within the
    // audio file that is being played back. At most, the end position can be moved to the
    // end of the audio file. If moved to the left, it can be moved at most to the
    // beginning of the audio file.
    // For a looped region, the drag right gesture changes the loop end position. That is,
    // maintaining the loop length and looping iterval, the loop end determines where playback
    // ends within the loop.
  }

  function onDragRightEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.Right) {
      dragState.current = DragState.None;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onDragRegionStart(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.None) {
      dragState.current = DragState.Region;
      dragStartX.current = event.clientX;
      dragStartY.current = event.clientY;
    }
  }

  function onDragRegionMove(event: React.PointerEvent<HTMLDivElement>) {
    // The drag region gesture moves the entire region. The start and end positions are
    // moved by the same amount. If the move operation would result in the region overalpping
    // another region on he same track, then we truncate the move region to fit within the
    // available free space on the track.
  }

  function onDragRegionEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.Region) {
      dragState.current = DragState.None;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onDragLoopStart(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.None) {
      dragState.current = DragState.Loop;
      dragStartX.current = event.clientX;
      dragStartY.current = event.clientY;
    }
  }

  function onDragLoopMove(event: React.PointerEvent<HTMLDivElement>) {
    //
  }

  function onDragLoopEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current === DragState.Loop) {
      dragState.current = DragState.None;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className={styles.region} style={style} onClick={toggleSelection}>
      <div className={styles.handles}>
        <div
          className={styles.leftHandle}
          onPointerDown={onDragLeftStart}
          onPointerMove={onDragLeftMove}
          onPointerUp={onDragLeftEnd}
        />
        <div
          className={styles.centerHandle}
          onPointerDown={onDragRegionStart}
          onPointerMove={onDragRegionMove}
          onPointerUp={onDragRegionEnd}
        />
        <div
          className={styles.rightHandle}
          onPointerDown={onDragRightStart}
          onPointerMove={onDragRightMove}
          onPointerUp={onDragRightEnd}
        />
        <div
          className={styles.loopHandle}
          onPointerDown={onDragLoopStart}
          onPointerMove={onDragLoopMove}
          onPointerUp={onDragLoopEnd}
        />
      </div>
      <div>
        <EditableText
          alwaysRenderInput={true}
          value={props.region.name}
          onChange={(value: string) => {
            changeName(value);
          }}
        />
      </div>
      {props.region.data.type === RegionDataType.Audio && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: `${REGION_RENDERING_HEIGHT_PX}px`,
            overflowX: 'hidden',
          }}
        >
          <img
            alt={props.region.name}
            height={REGION_RENDERING_HEIGHT_PX}
            width={audioImageWidth}
            src={renderData.current}
            style={{
              position: 'absolute',
              top: 0,
              left: `${-audioImageOffset}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};

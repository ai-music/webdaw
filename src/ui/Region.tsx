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

export const Region: FunctionComponent<RegionProps> = (props: RegionProps) => {
  const [selected, setSelected] = useState(false);

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

  return (
    <div className={styles.region} style={style} onClick={toggleSelection}>
      <div>{props.region.name}</div>
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

import { FunctionComponent, useEffect, useRef, useState } from 'react';

import styles from './Region.module.css';
import { RegionDataType, RegionInterface } from '../core/Region';
import { LocationToTime } from '../core/Common';
import { REGION_HEIGHT_PX, REGION_RENDERING_HEIGHT_PX, TRACK_HEIGHT_PX } from './Config';

export interface RegionProps {
  region: RegionInterface;
  trackIndex: number;
  scale: number;
  converter: LocationToTime;
}

function audioToImage(
  audioBuffer: AudioBuffer,
  width: number,
  offset: number = 0,
  duration: number = audioBuffer.duration,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width; // Set to desired width
  canvas.height = 64; // Set to desired height
  drawAudioBuffer(audioBuffer, canvas, offset, duration);
  return canvas.toDataURL();
}

function drawAudioBuffer(
  audioBuffer: AudioBuffer,
  canvas: HTMLCanvasElement,
  offset: number = 0,
  duration: number = audioBuffer.duration,
) {
  // ensure that the bufer is not empty
  if (!audioBuffer.length || !audioBuffer.duration) {
    return;
  }

  const context = canvas.getContext('2d')!;
  const data = audioBuffer.getChannelData(0);
  const bufferScale = audioBuffer.length / audioBuffer.duration;
  const startOffset = offset * bufferScale;
  const endOffset = Math.min(startOffset + duration * bufferScale, audioBuffer.length);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 2;
  context.strokeStyle = 'black';
  context.beginPath();
  const sliceWidth = canvas.width / (duration * bufferScale);
  let x = 0;
  for (let i = startOffset; i < endOffset; i++) {
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
  const width = duration * props.scale;

  const style = {
    borderColor: props.region.color,
    width: `${width}rem`,
    height: `${REGION_HEIGHT_PX}px`,
    left: `${props.converter.convertLocation(props.region.position) * props.scale}rem`,
    top: `${props.trackIndex * TRACK_HEIGHT_PX}px`,
    backgroundColor: selected ? props.region.color : 'transparent',
  };

  function retrieveImage(width: number, offset: number, duration: number): string {
    const cacheKey = width;
    const cachedItem = props.region.cache[cacheKey];

    if (cachedItem) {
      return cachedItem;
    } else if (props.region.data.type === RegionDataType.Audio) {
      const image = audioToImage(props.region.data.audioBuffer, width * 16, 0, duration);
      props.region.cache[cacheKey] = image;
      return image;
    } else {
      return '';
    }
  }

  const renderData = useRef<string>('');
  if (renderData.current === '' && props.region.data.type === RegionDataType.Audio) {
    console.log('rendering audio');
    renderData.current = retrieveImage(width, 0, duration);
  }

  useEffect(() => {
    if (props.region.data.type === RegionDataType.Audio) {
      console.log('re-rendering audio');
      renderData.current = retrieveImage(width, 0, duration);
    }
  }, [duration, props.scale, props.region.length]);

  function toggleSelection() {
    setSelected(!selected);
  }

  return (
    <div className={styles.region} style={style} onClick={toggleSelection}>
      <div>{props.region.name}</div>
      {props.region.data.type === RegionDataType.Audio && (
        <img
          alt={props.region.name}
          height={REGION_RENDERING_HEIGHT_PX}
          width="100%"
          src={renderData.current}
          // style={{ border: '1px solid black' }}
        />
      )}
    </div>
  );
};

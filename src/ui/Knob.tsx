import { FunctionComponent, useEffect, useState } from 'react';

import styles from './Knob.module.css';

export type Props = {
  label: string;
  min: number;
  max: number;
  labelRenderer?: (val: number) => string;
  defaultValue?: number;
  value?: number;
  size?: number;
  noLabels?: boolean;
  onChange?: (val: number) => void;
};

export const Knob: FunctionComponent<Props> = (props) => {
  const [value, setValue] = useState(props.value ?? props.defaultValue ?? 0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragTarget, setDragTarget] = useState<SVGSVGElement | null>(null);

  // TODO: Figure out how to set the cursor to 'grabbing' when dragging the knob.
  // useEffect(() => {
  //   if (dragTarget) {
  //     if (isDragging) dragTarget.style.cursor = 'grabbing';
  //     else dragTarget.style.cursor = 'default';
  //   }
  // }, [isDragging, dragTarget]);

  useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
    }
  }, [props.value]);

  function onChange(val: number) {
    if (props.onChange) props.onChange(val);
  }

  function changeValue(val: number) {
    setValue(val);
    onChange(val);
  }

  const size = props.size ? props.size : 100;
  const center = size / 2;
  const radius = ((size / 2) * 4) / 5;
  const sizeString = '0 0 ' + size + ' ' + size;
  const handleOffset = radius * 0.6;
  const handleRadius = 5 * (size / 100);
  const dialStroke = 3 * (size / 100);

  const angle = Math.PI * 1.5 * ((value - props.min) / (props.max - props.min)) + Math.PI * 0.25;
  const handleX = center + handleOffset * -Math.sin(angle);
  const handleY = center + handleOffset * Math.cos(angle);

  function onMouseDown(event: React.PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    setDragStart(event.clientY);
    setDragStartValue(value);
    setDragTarget(event.currentTarget);
  }

  function onMouseMove(event: React.PointerEvent<SVGSVGElement>) {
    if (isDragging) {
      const delta = dragStart - event.clientY;
      const deltaValue = (props.max - props.min) * (delta / size);
      const newValue = Math.min(Math.max(props.min, dragStartValue + deltaValue), props.max);

      if (newValue !== value) {
        changeValue(newValue);
      }
    }
  }

  function onMouseUp(event: React.PointerEvent<SVGSVGElement>) {
    if (isDragging) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDragging(false);
    }
  }

  return (
    <div className={styles.knob}>
      {!props.noLabels && (
        <div className={styles.label}>
          <label>{props.label}</label>
        </div>
      )}
      <div className={styles.dial}>
        <svg
          viewBox={sizeString}
          width={size}
          height={size}
          onPointerDown={onMouseDown}
          onPointerMove={onMouseMove}
          onPointerUp={onMouseUp}
          onDoubleClick={() => {
            setValue(props.defaultValue ?? 0);
          }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="gray"
            strokeWidth={dialStroke}
            fill="none"
          />
          <circle
            cx={handleX}
            cy={handleY}
            r={handleRadius}
            stroke="black"
            strokeWidth="3"
            fill="solid"
          />
        </svg>
      </div>
      {!props.noLabels && (
        <>
          <div className={styles.value}>{props.labelRenderer?.(value) ?? value}</div>
          <div className={styles.scales}>
            <div className={styles.scale}>{props.labelRenderer?.(props.min) ?? props.min}</div>
            <div className={styles.scale}>{props.labelRenderer?.(props.max) ?? props.max}</div>
          </div>
        </>
      )}
    </div>
  );
};

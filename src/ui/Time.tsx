import { FunctionComponent } from 'react';

export type Props = {
  label: string;
  timestamp: number;
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert timestamp to milliseconds
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export const Time: FunctionComponent<Props> = (props) => {
  return (
    <div>
      <div className="bp5-text-small">
        <label>{props.label}</label>
      </div>
      <div>{formatTime(props.timestamp)}</div>
    </div>
  );
};

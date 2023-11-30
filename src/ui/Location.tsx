import { FunctionComponent } from 'react';

export type Props = {
  label: string;
};

export const Location: FunctionComponent<Props> = (props) => {
  return (
    <span>
      <div className="bp5-text-small">
        <label>{props.label}</label>
      </div>
      <div>mmm:bb:ttt</div>
    </span>
  );
};

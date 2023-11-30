import { FunctionComponent } from 'react';

export type Props = {
  label: string;
};

export const Time: FunctionComponent<Props> = (props) => {
  return (
    <div>
      <div className="bp5-text-small">
        <label>{props.label}</label>
      </div>
      <div>hh:mm:ss:uuuu</div>
    </div>
  );
};

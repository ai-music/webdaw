import { FunctionComponent, useState } from 'react';

import styles from './DownloadControl.module.css';
import { Icon, Spinner } from '@blueprintjs/core';

export enum DownloadControlStatus {
  RemoteOnly,
  Downloading,
  Error,
  Local,
}

export interface DownloadControlProps {
  state: DownloadControlStatus;
  setState: (state: DownloadControlStatus) => void;
}

export const DownloadControl: FunctionComponent<DownloadControlProps> = (
  props: DownloadControlProps,
) => {
  const [state, setState] = useState<DownloadControlStatus>(props.state);

  function setStateAndPropagate(state: DownloadControlStatus) {
    setState(state);
    props.setState(state);
  }

  return (
    <span className={styles.downloadControl}>
      {state === DownloadControlStatus.RemoteOnly && (
        <Icon
          icon="cloud-download"
          onClick={() => setStateAndPropagate(DownloadControlStatus.Downloading)}
        />
      )}
      {state === DownloadControlStatus.Downloading && (
        <Spinner size={16} onClick={() => setStateAndPropagate(DownloadControlStatus.Local)} />
      )}
      {state === DownloadControlStatus.Error && <Icon icon="error" />}
      {state === DownloadControlStatus.Local && <Icon icon="tick" />}
    </span>
  );
};

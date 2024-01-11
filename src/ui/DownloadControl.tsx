import { FunctionComponent } from 'react';

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
  function setStateAndPropagate(state: DownloadControlStatus) {
    props.setState(state);
  }

  return (
    <span className={styles.downloadControl}>
      {props.state === DownloadControlStatus.RemoteOnly && (
        <Icon
          icon="cloud-download"
          onClick={() => setStateAndPropagate(DownloadControlStatus.Downloading)}
        />
      )}
      {props.state === DownloadControlStatus.Downloading && (
        <Spinner size={16} onClick={() => setStateAndPropagate(DownloadControlStatus.Local)} />
      )}
      {props.state === DownloadControlStatus.Error && <Icon icon="error" />}
      {props.state === DownloadControlStatus.Local && <Icon icon="tick" />}
    </span>
  );
};

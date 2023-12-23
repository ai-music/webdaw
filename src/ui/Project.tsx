import { FunctionComponent, useState } from 'react';

import { Arrangement } from './Arrangement';
import { Transport } from './Transport';
import { Mixer } from './Mixer';
import { Button, ButtonGroup, Section, SectionCard } from '@blueprintjs/core';
import { Project as ProjectObj } from '../core/Project';
import { Engine } from '../core/Engine';

export type ProjectProps = {
  project: ProjectObj;
  engine: Engine;
};

export const Project: FunctionComponent<ProjectProps> = (props) => {
  const [timelineScale, setTimelineScale] = useState(4);

  // const [mixerVisible, setMixerVisible] = useState(true);
  // const [infoPanelVisible, setInfoPanelVisible] = useState(false);

  // TODO: Need to add buttons to the toolbar to show/hide the Browser and InfoPanel
  //
  // Browser to the left, InfoPanel to the right, in the center stack of Arrangement, Editor
  return (
    <>
      <Transport
        engine={props.engine}
        project={props.project}
        timelineScale={timelineScale}
        setTimelineScale={setTimelineScale}
      />
      <Section title="Arrangement" compact={true} collapsible={true}>
        <SectionCard title="Arrangement">
          <Arrangement
            engine={props.engine}
            project={props.project}
            timelineScale={timelineScale}
          />
        </SectionCard>
      </Section>
      <Section title="Mixer" compact={true} collapsible={true}>
        <SectionCard title="Mixer">
          <Mixer />
        </SectionCard>
      </Section>
    </>
  );
};
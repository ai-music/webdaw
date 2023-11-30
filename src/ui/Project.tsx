import { FunctionComponent, useState } from 'react';

import { Arrangement } from './Arrangement';
import { Transport } from './Transport';
import { Mixer } from './Mixer';
import { Section, SectionCard } from '@blueprintjs/core';

export const Project: FunctionComponent = () => {
  // const [mixerVisible, setMixerVisible] = useState(true);
  // const [infoPanelVisible, setInfoPanelVisible] = useState(false);

  // TODO: Need to add buttons to the toolbar to show/hide the Browser and InfoPanel
  //
  // Browser to the left, InfoPanel to the right, in the center stack of Arrangement, Editor
  return (
    <>
      <Transport />
      <Section title="Arrangement" compact={true} collapsible={true}>
        <SectionCard title="Arrangement">
          <Arrangement />
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

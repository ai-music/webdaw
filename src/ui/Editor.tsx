import { FunctionComponent } from 'react';


export const Editor: FunctionComponent = () => {
  // Tabbed panel of:
  // - Either PianoRoll, DrumGrid or AudioEditor based on type of track
  // - Effects
  // - Mixer
  return (
    <p>Editor</p>
    // <TabView>
    //   <TabPanel header="Piano Roll">
    //     <PianoRoll />
    //   </TabPanel>
    //   <TabPanel header="Effects">
    //     <TrackEffects />
    //   </TabPanel>
    // </TabView>
  );
};

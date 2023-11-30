import { FunctionComponent } from 'react';

import { EQ } from './effects/EQ';
import { Compressor } from './effects/Compressor';

export const TrackEffects: FunctionComponent = () => {
  return (
    <>
      {/* Create from data model */}
      <EQ />
      <Compressor />
    </>
  );
};

// An analog synthesizer following the traditional oscillator -> filter -> amplifier signal flow.

import { Instrument } from '../core/Instrument';

export class Analog implements Instrument {
  readonly name = 'Analog';
}

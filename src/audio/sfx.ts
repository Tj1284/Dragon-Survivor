import { noise, tone, type Voice } from './synth';

export type SfxName = 'hit' | 'kill' | 'gem' | 'gold' | 'levelup' | 'evolve' | 'pick' | 'hurt' | 'boss' | 'slam' | 'chest' | 'victory' | 'defeat' | 'click';

const N = (semis: number) => 440 * Math.pow(2, semis / 12);

/** Every sound effect, as a short recipe scheduled at time t. */
export const SFX: Record<SfxName, (v: Voice, t: number) => void> = {
  hit: (v, t) => noise(v, t, 0.05, { vol: 0.08, freq: 2400, type: 'highpass' }),
  kill: (v, t) => { noise(v, t, 0.09, { vol: 0.12, freq: 900 }); tone(v, t, 220, 0.08, { slideTo: 110, vol: 0.06 }); },
  gem: (v, t) => tone(v, t, N(12), 0.07, { type: 'triangle', slideTo: N(19), vol: 0.1 }),
  gold: (v, t) => { tone(v, t, N(19), 0.05, { vol: 0.07 }); tone(v, t + 0.05, N(24), 0.08, { vol: 0.07 }); },
  levelup: (v, t) => [0, 4, 7, 12].forEach((s, i) => tone(v, t + i * 0.07, N(s + 3), 0.12, { vol: 0.1 })),
  evolve: (v, t) => { tone(v, t, N(-12), 0.6, { slideTo: N(12), vol: 0.12 }); noise(v, t + 0.45, 0.4, { vol: 0.12, freq: 3000 }); [0, 4, 7, 12, 16].forEach((s, i) => tone(v, t + 0.5 + i * 0.06, N(s + 3), 0.18, { type: 'triangle', vol: 0.1 })); },
  pick: (v, t) => { tone(v, t, N(7), 0.06, { vol: 0.08 }); tone(v, t + 0.06, N(14), 0.1, { vol: 0.08 }); },
  hurt: (v, t) => { tone(v, t, 160, 0.12, { type: 'sawtooth', slideTo: 80, vol: 0.12 }); noise(v, t, 0.08, { vol: 0.08, freq: 600 }); },
  boss: (v, t) => [0, 0.3, 0.6].forEach((d, i) => tone(v, t + d, N(-24 + i), 0.35, { type: 'sawtooth', vol: 0.1 })),
  slam: (v, t) => { noise(v, t, 0.35, { vol: 0.25, freq: 300 }); tone(v, t, 90, 0.3, { slideTo: 40, vol: 0.15 }); },
  chest: (v, t) => [0, 5, 9, 12].forEach((s, i) => tone(v, t + i * 0.05, N(s + 7), 0.1, { type: 'triangle', vol: 0.1 })),
  victory: (v, t) => [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => tone(v, t + i * 0.12, N(s), 0.22, { vol: 0.1 })),
  defeat: (v, t) => [7, 4, 0, -5].forEach((s, i) => tone(v, t + i * 0.18, N(s - 5), 0.3, { type: 'triangle', vol: 0.12 })),
  click: (v, t) => tone(v, t, N(10), 0.04, { vol: 0.06 }),
};

/** Eight-bar loop: bass on the beat and a short arpeggio, quiet enough to sit under the effects. */
const BASS = [-24, -24, -21, -19, -24, -24, -17, -19];
const ARP = [0, 3, 7, 10];

export function scheduleBar(v: Voice, t: number, bar: number, beat: number): void {
  const root = BASS[bar % BASS.length];
  for (let i = 0; i < 4; i++) tone(v, t + i * beat, N(root), beat * 0.9, { type: 'triangle', vol: 0.06 });
  for (let i = 0; i < 8; i++) tone(v, t + i * (beat / 2), N(root + 24 + ARP[i % 4]), beat * 0.35, { vol: 0.018 });
}

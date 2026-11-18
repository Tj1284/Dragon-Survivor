/** Tiny retro synth on Web Audio: square/triangle tones with pitch slides, filtered noise bursts. */
export interface Voice { ctx: AudioContext; out: AudioNode }

/** Notes started so far (debug: proves nothing plays while the tab is hidden). */
export const synthStats = { notes: 0 };

export function tone(v: Voice, t: number, freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; slideTo?: number } = {}): void {
  synthStats.notes++;
  const osc = v.ctx.createOscillator();
  const gain = v.ctx.createGain();
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t + dur);
  const vol = opts.vol ?? 0.15;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(v.out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;

export function noise(v: Voice, t: number, dur: number, opts: { vol?: number; freq?: number; type?: BiquadFilterType } = {}): void {
  if (!noiseBuffer || noiseBuffer.sampleRate !== v.ctx.sampleRate) {
    noiseBuffer = v.ctx.createBuffer(1, v.ctx.sampleRate * 0.5, v.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  synthStats.notes++;
  const src = v.ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = v.ctx.createBiquadFilter();
  filter.type = opts.type ?? 'lowpass';
  filter.frequency.value = opts.freq ?? 1200;
  const gain = v.ctx.createGain();
  gain.gain.setValueAtTime(opts.vol ?? 0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(v.out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

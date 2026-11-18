import { createLimiter } from './limiter';
import { SFX, scheduleBar, type SfxName } from './sfx';
import type { Voice } from './synth';

const BEAT = 60 / 112;

/**
 * Game audio. Browsers block sound until a user gesture, so the AudioContext is created on the first tap or key
 * and nothing plays before that. Mute silences effects and music and is remembered in the save by the caller.
 */
class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private readonly limiter = createLimiter({ perSound: 0.05, window: 0.1, maxInWindow: 8 });
  private readonly played: Partial<Record<SfxName, number>> = {};
  private musicOn = false;
  private nextBarAt = 0;
  private bar = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof document === 'undefined') return;
    const unlock = () => this.unlock();
    document.addEventListener('pointerdown', unlock, { once: false, passive: true });
    document.addEventListener('keydown', unlock);
  }

  get unlocked(): boolean { return this.ctx !== null; }
  get muted(): boolean { return this.limiter.muted; }

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.limiter.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.8;
      this.music.connect(this.master);
      if (this.musicOn) this.startScheduler();
    } catch {
      this.ctx = null; // no Web Audio: the game simply stays silent
    }
  }

  setMuted(muted: boolean): void {
    this.limiter.muted = muted;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
  }

  play(name: SfxName): void {
    if (!this.ctx || !this.master) return;
    if (!this.limiter.allow(name, this.ctx.currentTime)) return;
    this.played[name] = (this.played[name] ?? 0) + 1;
    try { SFX[name]({ ctx: this.ctx, out: this.master }, this.ctx.currentTime + 0.005); } catch { /* ignore a failed sound */ }
  }

  startMusic(): void {
    this.musicOn = true;
    if (this.ctx) this.startScheduler();
  }

  stopMusic(): void {
    this.musicOn = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private startScheduler(): void {
    if (this.timer || !this.ctx) return;
    this.nextBarAt = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => {
      if (!this.ctx || !this.music) return;
      while (this.nextBarAt < this.ctx.currentTime + 0.6) {
        const v: Voice = { ctx: this.ctx, out: this.music };
        scheduleBar(v, this.nextBarAt, this.bar++, BEAT);
        this.nextBarAt += BEAT * 4;
      }
    }, 200);
  }

  stats() {
    return { unlocked: this.unlocked, muted: this.muted, played: { ...this.played }, maxInWindow: this.limiter.maxSeen, music: this.musicOn };
  }
}

export const audio = new GameAudio();
export type { SfxName };

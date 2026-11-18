import { createLimiter } from './limiter';
import { SFX, scheduleBar, type SfxName } from './sfx';
import { synthStats, type Voice } from './synth';

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
    // pointerup/touchend/click count as user activation on mobile browsers; pointerdown alone may not
    const unlock = () => this.unlock();
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { passive: true });
    // a hidden tab must be silent (Playgama 3.3.5); suspending also freezes currentTime, so no music gets scheduled
    document.addEventListener('visibilitychange', () => this.onVisibility());
  }

  /** True once the context is actually running (it can exist but stay suspended or 'interrupted' on iOS). */
  get unlocked(): boolean { return this.ctx?.state === 'running'; }
  get muted(): boolean { return this.limiter.muted; }

  unlock(): void {
    if (this.ctx) { this.resume(); return; }
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

  private resume(): void {
    if (!this.ctx || document.hidden || this.ctx.state === 'running') return;
    void this.ctx.resume().then(() => { if (this.ctx) this.nextBarAt = this.ctx.currentTime + 0.1; }).catch(() => {});
  }

  private onVisibility(): void {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend().catch(() => {});
    else this.resume();
  }

  setMuted(muted: boolean): void {
    this.limiter.muted = muted;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
  }

  play(name: SfxName): void {
    // nothing is queued while suspended or hidden: it would all burst out on resume
    if (!this.ctx || !this.master || this.ctx.state !== 'running' || document.hidden) return;
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
      if (!this.ctx || !this.music || this.ctx.state !== 'running') return;
      while (this.nextBarAt < this.ctx.currentTime + 0.6) {
        const v: Voice = { ctx: this.ctx, out: this.music };
        scheduleBar(v, this.nextBarAt, this.bar++, BEAT);
        this.nextBarAt += BEAT * 4;
      }
    }, 200);
  }

  stats() {
    return { unlocked: this.unlocked, state: this.ctx?.state ?? 'none', notes: synthStats.notes, muted: this.muted, played: { ...this.played }, maxInWindow: this.limiter.maxSeen, music: this.musicOn };
  }
}

export const audio = new GameAudio();
export type { SfxName };

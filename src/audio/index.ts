import { audioShouldRun, isSilent } from './state';
import { MUSIC_VOLUME, SFX_NAMES, SFX_VOLUME, type MusicTrack, type SfxName } from './catalog';
import { createLimiter } from './limiter';

const SFX_URLS = import.meta.glob('/audio/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const MUSIC_URLS = import.meta.glob('/audio/music/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const FADE = 0.4;

/**
 * Game audio from recorded MP3 files (CC0, docs/CREDITS.md).
 * - Browsers block sound until a user gesture: the AudioContext is created on the first tap or key.
 * - Effects are downloaded at boot and decoded once the context exists; music is fetched lazily when first needed.
 * - Mute and a hidden tab silence everything (Playgama 3.3.3 and 3.3.5).
 */
class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly limiter = createLimiter({ perSound: 0.05, window: 0.1, maxInWindow: 8 });
  private readonly played: Partial<Record<SfxName, number>> = {};
  private readonly raw = new Map<string, Promise<ArrayBuffer>>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private wantedMusic: MusicTrack | null = null;
  private music: { track: MusicTrack; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private sources = 0;

  constructor() {
    if (typeof document === 'undefined') return;
    // pointerup/touchend/click count as user activation on mobile browsers; pointerdown alone may not
    const unlock = () => this.unlock();
    for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { passive: true });
    document.addEventListener('visibilitychange', () => this.onVisibility());
    for (const name of SFX_NAMES) this.fetchRaw(`/audio/sfx/${name}.mp3`, SFX_URLS);
  }

  /** True once the context is actually running (it can exist but stay suspended or 'interrupted' on iOS). */
  get unlocked(): boolean { return this.ctx?.state === 'running'; }
  /** The player's own sound setting (what the sound button shows). */
  get muted(): boolean { return this.userMuted; }
  private userMuted = false;
  private platformMuted = false;
  private platformPaused = false;
  private get running(): boolean { return audioShouldRun({ hidden: document.hidden, platformPaused: this.platformPaused }); }

  private fetchRaw(key: string, urls: Record<string, string>): Promise<ArrayBuffer> | null {
    const url = urls[key];
    if (!url) return null;
    let p = this.raw.get(key);
    if (!p) {
      p = fetch(url).then((r) => r.arrayBuffer());
      p.catch(() => this.raw.delete(key)); // allow a retry later
      this.raw.set(key, p);
    }
    return p;
  }

  /** Decodes a file once; each decode gets its own copy of the bytes because decodeAudioData detaches them. */
  private async load(key: string, urls: Record<string, string>): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const raw = this.fetchRaw(key, urls);
    if (!raw || !this.ctx) return null;
    try {
      const buffer = await this.ctx.decodeAudioData((await raw).slice(0));
      this.buffers.set(key, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  unlock(): void {
    if (this.ctx) { this.resume(); return; }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.limiter.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      for (const name of SFX_NAMES) void this.load(`/audio/sfx/${name}.mp3`, SFX_URLS);
      if (this.wantedMusic) void this.startMusic(this.wantedMusic);
    } catch {
      this.ctx = null; // no Web Audio: the game simply stays silent
    }
  }

  private resume(): void {
    if (!this.ctx || !this.running || this.ctx.state === 'running') return;
    void this.ctx.resume().catch(() => {});
  }

  private onVisibility(): void {
    if (!this.ctx) return;
    if (!this.running) void this.ctx.suspend().catch(() => {});
    else this.resume();
  }

  setMuted(muted: boolean): void {
    this.userMuted = muted;
    this.applyMute();
  }

  /** The platform asks for silence (its sound toggle, an ad); independent of the player's setting. */
  setPlatformMuted(muted: boolean): void {
    this.platformMuted = muted;
    this.applyMute();
  }

  /** The platform paused the game (ad, tab switch): stop the audio clock until it resumes. */
  setPlatformPaused(paused: boolean): void {
    this.platformPaused = paused;
    this.onVisibility();
  }

  private applyMute(): void {
    const silent = isSilent({ user: this.userMuted, platform: this.platformMuted });
    this.limiter.muted = silent;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(silent ? 0 : 1, this.ctx.currentTime);
  }

  play(name: SfxName): void {
    // nothing is queued while suspended or hidden: it would all burst out on resume
    if (!this.ctx || !this.master || this.ctx.state !== 'running' || !this.running) return;
    const buffer = this.buffers.get(`/audio/sfx/${name}.mp3`);
    if (!buffer || !this.limiter.allow(name, this.ctx.currentTime)) return;
    this.played[name] = (this.played[name] ?? 0) + 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = SFX_VOLUME[name];
    src.connect(gain).connect(this.master);
    src.start();
    this.sources++;
  }

  /** Switches the music to `track` (null = silence), fading out the current one. */
  playMusic(track: MusicTrack | null): void {
    this.wantedMusic = track;
    if (this.music?.track === track) return;
    this.fadeOutMusic();
    if (track && this.ctx) void this.startMusic(track);
  }

  private fadeOutMusic(): void {
    if (!this.music || !this.ctx) { this.music = null; return; }
    const { src, gain } = this.music;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + FADE);
    try { src.stop(t + FADE + 0.05); } catch { /* already stopped */ }
    this.music = null;
  }

  private async startMusic(track: MusicTrack): Promise<void> {
    const buffer = await this.load(`/audio/music/${track}.mp3`, MUSIC_URLS);
    if (!buffer || !this.ctx || !this.master || this.wantedMusic !== track || this.music?.track === track) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = track !== 'ending';
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, this.ctx.currentTime + FADE);
    src.connect(gain).connect(this.master);
    src.start();
    this.sources++;
    this.music = { track, src, gain };
  }

  stats() {
    return {
      unlocked: this.unlocked, state: this.ctx?.state ?? 'none', notes: this.sources, muted: this.muted, silent: this.limiter.muted, platformPaused: this.platformPaused,
      loaded: SFX_NAMES.filter((n) => this.buffers.has(`/audio/sfx/${n}.mp3`)).length,
      music: this.music?.track ?? null, played: { ...this.played }, maxInWindow: this.limiter.maxSeen,
    };
  }
}

export const audio = new GameAudio();
export type { MusicTrack, SfxName };

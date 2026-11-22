import type {} from '@playgama/bridge/global';
import { rewardedResult } from '../logic/ads';

/** Every call to the Playgama Bridge goes through here. Without the SDK (or if it fails) the game keeps working with safe defaults. */
type Bridge = typeof globalThis.bridge;
type AdMock = 'rewarded' | 'slow' | 'closed' | 'failed' | 'hang';

const INIT_TIMEOUT = 8000;
/** Some platforms never send `closed` after `rewarded`: grant the reward after this long. */
const REWARD_GRACE = 3000;
/** The SDK sends nothing when an ad can't start (one already running, too soon): give up after this long. */
const AD_START_TIMEOUT = 8000;
/** An interstitial that shows no sign of life this long after the request was skipped by the SDK. */
const INTERSTITIAL_IDLE = 1500;
/** Safety net: never wait for an ad longer than this. */
const AD_MAX_WAIT = 90000;

let br: Bridge | null = null;
let gameReadySent = false;
let adMock: AdMock | null = null;
let interstitialMockMs: number | null = null;
const lateReady: (() => void)[] = [];
let interstitialsShown = 0;

function sdk(): Bridge | null { return br; }

export const platform = {
  async init(): Promise<void> {
    const b = typeof globalThis.bridge !== 'undefined' ? globalThis.bridge : null;
    if (!b) return;
    const started = b.initialize();
    try {
      await Promise.race([started, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), INIT_TIMEOUT))]);
      br = b;
    } catch (e) {
      console.warn('Playgama Bridge is slow or failed to initialize; starting without it for now', e);
      // a slow SDK is adopted as soon as it is ready (ads, events, cloud save); a failed one never is
      started.then(() => { br = b; for (const cb of lateReady) cb(); }, () => {});
    }
  },

  /** Runs once the SDK becomes ready after the game had to start without it. */
  onLateReady(cb: () => void): void { lateReady.push(cb); },

  get ready(): boolean { return br !== null; },
  get id(): string { return sdk()?.platform.id ?? 'none'; },
  get language(): string { return sdk()?.platform.language || navigator.language || 'en'; },
  get audioEnabled(): boolean { return sdk()?.platform.isAudioEnabled !== false; },

  onAudio(cb: (enabled: boolean) => void): void {
    const b = sdk();
    b?.platform.on(b.EVENT_NAME.AUDIO_STATE_CHANGED, (v: unknown) => cb(v !== false));
  },
  onPause(cb: (paused: boolean) => void): void {
    const b = sdk();
    b?.platform.on(b.EVENT_NAME.PAUSE_STATE_CHANGED, (v: unknown) => cb(v === true));
  },

  /** The first playable frame is on screen (sent once). */
  gameReady(): void {
    if (gameReadySent) return;
    gameReadySent = true;
    platform.message('game_ready');
    // without a ready SDK nobody would remove its loading screen, and it covers the whole game
    if (!br && typeof document !== 'undefined') document.getElementById('loading-overlay')?.remove();
  },
  message(name: string): void {
    try {
      const r = sdk()?.platform.sendMessage(name as never) as unknown;
      if (r && typeof (r as Promise<unknown>).catch === 'function') (r as Promise<unknown>).catch(() => { /* not relayed */ });
    } catch { /* not relayed on this platform */ }
  },

  /**
   * Asks for an interstitial at a natural pause and resolves once it is over (or was skipped), so the
   * caller can start the next run without the ad landing on top of gameplay. Bridge decides whether one shows.
   */
  interstitial(placement: string): Promise<void> {
    if (interstitialMockMs !== null) { interstitialsShown++; return new Promise((r) => setTimeout(r, interstitialMockMs!)); }
    const b = sdk();
    if (!b || !b.advertisement.isInterstitialSupported) return Promise.resolve();
    return new Promise((resolve) => {
      let started = false, finished = false;
      const timers: ReturnType<typeof setTimeout>[] = [];
      const done = () => {
        if (finished) return;
        finished = true;
        b.advertisement.off(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onState);
        timers.forEach(clearTimeout);
        resolve();
      };
      const onState = (state: unknown) => {
        if (state === 'closed' || state === 'failed') done();
        else started = true;
      };
      b.advertisement.on(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onState);
      timers.push(setTimeout(() => { if (!started) done(); }, INTERSTITIAL_IDLE), setTimeout(done, AD_MAX_WAIT));
      try { b.advertisement.showInterstitial(placement); } catch { done(); }
    });
  },

  get rewardedSupported(): boolean {
    if (adMock) return true;
    return sdk()?.advertisement.isRewardedSupported === true;
  },

  /** Shows a rewarded ad; resolves true only if it was watched to the end. */
  rewarded(placement: string): Promise<boolean> {
    if (adMock === 'hang') return new Promise(() => { /* an ad that never answers */ });
    if (adMock) {
      const mock = adMock;
      const paid = mock === 'rewarded' || mock === 'slow';
      return new Promise((r) => setTimeout(() => r(rewardedResult(paid ? ['opened', 'rewarded', 'closed'] : [mock]) === 'rewarded'), mock === 'slow' ? 1000 : 50));
    }
    const b = sdk();
    if (!b || !b.advertisement.isRewardedSupported) return Promise.resolve(false);
    return new Promise((resolve) => {
      const states: string[] = [];
      let finished = false;
      let grace: ReturnType<typeof setTimeout> | null = null;
      const timers: ReturnType<typeof setTimeout>[] = [];
      const done = (ok: boolean) => {
        if (finished) return;
        finished = true;
        b.advertisement.off(b.EVENT_NAME.REWARDED_STATE_CHANGED, onState);
        if (grace) clearTimeout(grace);
        timers.forEach(clearTimeout);
        resolve(ok);
      };
      const onState = (state: unknown) => {
        states.push(String(state));
        const result = rewardedResult(states);
        if (result !== 'pending') done(result === 'rewarded');
        else if (state === 'rewarded' && !grace) grace = setTimeout(() => done(true), REWARD_GRACE);
      };
      b.advertisement.on(b.EVENT_NAME.REWARDED_STATE_CHANGED, onState);
      // the SDK stays silent when the ad can't start: never leave the player waiting on it
      timers.push(setTimeout(() => { if (!states.includes('opened') && !states.includes('rewarded')) done(false); }, AD_START_TIMEOUT));
      timers.push(setTimeout(() => done(states.includes('rewarded')), AD_MAX_WAIT));
      try { b.advertisement.showRewarded(placement); } catch { done(false); }
    });
  },

  async storageGet(key: string): Promise<string | null> {
    const b = sdk();
    if (!b) return null;
    try {
      const r = await b.storage.get([key], false);
      const v = Array.isArray(r) ? r[0] : r;
      return typeof v === 'string' ? v : v == null ? null : JSON.stringify(v);
    } catch { return null; }
  },
  storageSet(key: string, value: string): void {
    sdk()?.storage.set([key], [value]).catch(() => { /* retried on the next save */ });
  },

  /** Debug/tests only: fake the outcome of rewarded ads. */
  setAdMock(m: AdMock | null): void { adMock = m; },
  /** Debug/tests only: fake interstitials that last `ms` (null = real SDK). */
  setInterstitialMock(ms: number | null): void { interstitialMockMs = ms; },
  get interstitialsShown(): number { return interstitialsShown; },
};

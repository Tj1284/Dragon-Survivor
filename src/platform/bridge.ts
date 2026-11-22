import type {} from '@playgama/bridge/global';
import { rewardedResult } from '../logic/ads';

/** Every call to the Playgama Bridge goes through here. Without the SDK (or if it fails) the game keeps working with safe defaults. */
type Bridge = typeof globalThis.bridge;
type AdMock = 'rewarded' | 'closed' | 'failed';

const INIT_TIMEOUT = 8000;
/** Some platforms never send `closed` after `rewarded`: grant the reward after this long. */
const REWARD_GRACE = 3000;

let br: Bridge | null = null;
let gameReadySent = false;
let adMock: AdMock | null = null;

function sdk(): Bridge | null { return br; }

export const platform = {
  async init(): Promise<void> {
    const b = typeof globalThis.bridge !== 'undefined' ? globalThis.bridge : null;
    if (!b) return;
    try {
      await Promise.race([b.initialize(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), INIT_TIMEOUT))]);
      br = b;
    } catch (e) {
      console.warn('Playgama Bridge failed to initialize; playing without it', e);
    }
  },

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
  },
  message(name: string): void {
    try { sdk()?.platform.sendMessage(name as never); } catch { /* not relayed on this platform */ }
  },

  /** Asks for an interstitial at a natural pause; Bridge decides whether one is actually shown. */
  interstitial(placement: string): void {
    const b = sdk();
    try { if (b?.advertisement.isInterstitialSupported) b.advertisement.showInterstitial(placement); } catch { /* no ad */ }
  },

  get rewardedSupported(): boolean {
    if (adMock) return true;
    return sdk()?.advertisement.isRewardedSupported === true;
  },

  /** Shows a rewarded ad; resolves true only if it was watched to the end. */
  rewarded(placement: string): Promise<boolean> {
    if (adMock) {
      const mock = adMock;
      return new Promise((r) => setTimeout(() => r(rewardedResult(mock === 'rewarded' ? ['opened', 'rewarded', 'closed'] : [mock]) === 'rewarded'), 50));
    }
    const b = sdk();
    if (!b || !b.advertisement.isRewardedSupported) return Promise.resolve(false);
    return new Promise((resolve) => {
      const states: string[] = [];
      let grace: ReturnType<typeof setTimeout> | null = null;
      const done = (ok: boolean) => {
        b.advertisement.off(b.EVENT_NAME.REWARDED_STATE_CHANGED, onState);
        if (grace) clearTimeout(grace);
        resolve(ok);
      };
      const onState = (state: unknown) => {
        states.push(String(state));
        const result = rewardedResult(states);
        if (result !== 'pending') done(result === 'rewarded');
        else if (state === 'rewarded' && !grace) grace = setTimeout(() => done(true), REWARD_GRACE);
      };
      b.advertisement.on(b.EVENT_NAME.REWARDED_STATE_CHANGED, onState);
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
};

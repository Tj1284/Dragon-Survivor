import { afterEach, beforeEach, expect, it, vi } from 'vitest';

type Fn = (v: unknown) => void;
function fake(initialize: () => Promise<void> = () => Promise.resolve()) {
  const handlers = new Map<string, Set<Fn>>();
  const on = (n: string, f: Fn) => { if (!handlers.has(n)) handlers.set(n, new Set()); handlers.get(n)!.add(f); };
  const off = (n: string, f?: Fn) => { if (f) handlers.get(n)?.delete(f); else handlers.delete(n); };
  const emit = (n: string, v: unknown) => [...(handlers.get(n) ?? [])].forEach((f) => f(v));
  const shown: string[] = [];
  const bridge = {
    initialize,
    EVENT_NAME: { REWARDED_STATE_CHANGED: 'rewarded', INTERSTITIAL_STATE_CHANGED: 'inter', AUDIO_STATE_CHANGED: 'audio', PAUSE_STATE_CHANGED: 'pause' },
    advertisement: { isRewardedSupported: true, isInterstitialSupported: true, on, off, showRewarded: (p: string) => shown.push('r:' + p), showInterstitial: (p: string) => shown.push('i:' + p) },
    platform: { language: 'es', isAudioEnabled: true, on, sendMessage: () => Promise.resolve() },
    storage: { get: () => Promise.resolve([null]), set: () => Promise.resolve() },
  };
  return { bridge, emit, handlers, shown };
}
const listeners = (f: ReturnType<typeof fake>, n: string) => f.handlers.get(n)?.size ?? 0;

async function load(f: ReturnType<typeof fake>) {
  (globalThis as { bridge?: unknown }).bridge = f.bridge;
  const { platform } = await import('../../src/platform/bridge');
  return platform;
}

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); delete (globalThis as { bridge?: unknown }).bridge; });

it('a rewarded ad watched to the end pays out and stops listening', async () => {
  const f = fake(); const platform = await load(f); await platform.init();
  const p = platform.rewarded('revive');
  f.emit('rewarded', 'opened'); f.emit('rewarded', 'rewarded'); f.emit('rewarded', 'closed');
  expect(await p).toBe(true);
  expect(listeners(f, 'rewarded')).toBe(0);
});

it('a rewarded ad that never starts gives up, pays nothing and stops listening', async () => {
  const f = fake(); const platform = await load(f); await platform.init();
  const p = platform.rewarded('revive');
  await vi.advanceTimersByTimeAsync(10000);
  expect(await p).toBe(false);
  expect(listeners(f, 'rewarded')).toBe(0);
});

it('an interstitial is waited for until it closes, and skipped quickly when nothing happens', async () => {
  const f = fake(); const platform = await load(f); await platform.init();
  let done = false;
  void platform.interstitial('game_over').then(() => { done = true; });
  f.emit('inter', 'loading'); await vi.advanceTimersByTimeAsync(5000);
  expect(done).toBe(false); // still loading: the next run must not start under the ad
  f.emit('inter', 'opened'); f.emit('inter', 'closed'); await vi.advanceTimersByTimeAsync(0);
  expect(done).toBe(true);
  let skipped = false;
  void platform.interstitial('game_over').then(() => { skipped = true; });
  await vi.advanceTimersByTimeAsync(2000); // too early / ad in progress: the SDK sends nothing
  expect(skipped).toBe(true);
  expect(listeners(f, 'inter')).toBe(0);
});

it('an SDK that is slow to start is adopted when it finally does, and its loading screen never blocks the game', async () => {
  let resolveInit!: () => void;
  const f = fake(() => new Promise<void>((r) => { resolveInit = r; }));
  const overlay = { remove: vi.fn() };
  (globalThis as { document?: unknown }).document = { getElementById: (id: string) => (id === 'loading-overlay' ? overlay : null) };
  const platform = await load(f);
  const late = vi.fn();
  platform.onLateReady(late);
  const init = platform.init();
  await vi.advanceTimersByTimeAsync(20000);
  await init;
  expect(platform.ready).toBe(false);
  platform.gameReady();
  expect(overlay.remove).toHaveBeenCalled();
  resolveInit(); await vi.advanceTimersByTimeAsync(0);
  expect(platform.ready).toBe(true);
  expect(late).toHaveBeenCalled();
  delete (globalThis as { document?: unknown }).document;
});

import type * as Phaser from 'phaser';

type DebugFn = (...args: any[]) => unknown;
export interface DebugApi { ready: boolean; [name: string]: unknown }

declare global {
  interface Window { __dbg?: DebugApi }
}

const pending: Record<string, DebugFn> = {};

export function isDebug(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
}

/** Exposes window.__dbg when the page is opened with ?debug=1. */
export function installDebug(game: Phaser.Game): void {
  if (!isDebug()) return;
  window.__dbg = { ready: false, game, ...pending };
}

/** Lets any module add a debug command; no-op outside debug mode. */
export function registerDebug(name: string, fn: DebugFn): void {
  pending[name] = fn;
  if (window.__dbg) window.__dbg[name] = fn;
}

export function setDebugReady(ready: boolean): void {
  if (window.__dbg) window.__dbg.ready = ready;
}

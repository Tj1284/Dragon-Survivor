export interface LimiterOptions { perSound: number; window: number; maxInWindow: number }

/** Decides whether a sound may play now: one per name every `perSound` s, and at most `maxInWindow` per `window` s overall. */
export function createLimiter(o: LimiterOptions) {
  const last = new Map<string, number>();
  const recent: number[] = [];
  const limiter = {
    muted: false,
    /** Most sounds that passed in any single window so far (for tests). */
    maxSeen: 0,
    allow(name: string, t: number): boolean {
      if (limiter.muted) return false;
      if (t - (last.get(name) ?? -Infinity) < o.perSound) return false;
      while (recent.length && t - recent[0] >= o.window) recent.shift();
      if (recent.length >= o.maxInWindow) return false;
      recent.push(t);
      last.set(name, t);
      limiter.maxSeen = Math.max(limiter.maxSeen, recent.length);
      return true;
    },
  };
  return limiter;
}

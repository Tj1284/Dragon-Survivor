export interface Point { id: number; x: number; y: number }

/** Greedy chain: from the current point jump to the nearest unhit candidate within range. The first target counts as a jump. */
export function chainTargets(origin: { x: number; y: number }, candidates: readonly Point[], maxJumps: number, range: number): number[] {
  const hit: number[] = [];
  const done = new Set<number>();
  let cx = origin.x, cy = origin.y;
  const r2 = range * range;
  while (hit.length < maxJumps) {
    let best: Point | null = null;
    let bestD = Infinity;
    for (const c of candidates) {
      if (done.has(c.id)) continue;
      const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
      if (d <= r2 && d < bestD) { best = c; bestD = d; }
    }
    if (!best) break;
    hit.push(best.id);
    done.add(best.id);
    cx = best.x; cy = best.y;
  }
  return hit;
}

export function armorReduce(damage: number, armor: number): number {
  return Math.max(1, damage - armor);
}

export interface IceStatus { hitTimes: number[]; slowUntil: number; frozenUntil: number }

export const ICE = { freezeHits: 3, window: 2, freezeDuration: 1.5 };

export function newIceStatus(): IceStatus {
  return { hitTimes: [], slowUntil: 0, frozenUntil: 0 };
}

export function registerIceHit(s: IceStatus, now: number, slowDuration = 2): IceStatus {
  const hitTimes = [...s.hitTimes.filter((t) => now - t <= ICE.window), now];
  const slowUntil = Math.max(s.slowUntil, now + slowDuration);
  if (hitTimes.length >= ICE.freezeHits) {
    return { hitTimes: [], slowUntil, frozenUntil: Math.max(s.frozenUntil, now + ICE.freezeDuration) };
  }
  return { hitTimes, slowUntil, frozenUntil: s.frozenUntil };
}

export function damageMultiplier(s: IceStatus, now: number, shatterLevel: number): number {
  return now < s.frozenUntil ? 1.5 + 0.25 * shatterLevel : 1;
}

/** Damage over time. `acc` is the time poisoned since the last tick. */
export interface PoisonStatus { until: number; dps: number; acc: number }

export const POISON_TICK = 0.5;

export function newPoison(): PoisonStatus {
  return { until: 0, dps: 0, acc: 0 };
}

/** Keeps the stronger poison and the later end time. An expired poison is replaced. */
export function applyPoison(s: PoisonStatus, dps: number, duration: number, now: number): PoisonStatus {
  const active = now < s.until;
  return { until: Math.max(active ? s.until : 0, now + duration), dps: active ? Math.max(s.dps, dps) : dps, acc: active ? s.acc : 0 };
}

/** Advances the poison by dt ending at `now`; damage comes out in POISON_TICK steps. */
export function tickPoison(s: PoisonStatus, dt: number, now: number): { s: PoisonStatus; damage: number } {
  const start = now - dt;
  if (start >= s.until) return { s: s.acc === 0 ? s : { ...s, acc: 0 }, damage: 0 };
  let acc = s.acc + Math.min(dt, s.until - start);
  let damage = 0;
  while (acc >= POISON_TICK - 1e-6) { acc -= POISON_TICK; damage += s.dps * POISON_TICK; }
  return { s: { ...s, acc: Math.max(0, acc) }, damage };
}

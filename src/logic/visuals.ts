import type { FormId } from './types';

export interface TintState { flashing: boolean; frozen: boolean; stunned: boolean; poisoned: boolean; windup: boolean }
export interface Tint { color: number; mode: 'fill' | 'multiply' }

/**
 * Enemy tint by priority. The lancer's wind-up warning outranks poison: poison is nearly permanent
 * around a poison dragon and would otherwise hide the dash tell.
 */
export function enemyTint(s: TintState): Tint | null {
  if (s.flashing) return { color: 0xffffff, mode: 'fill' };
  if (s.frozen) return { color: 0x9fdcff, mode: 'multiply' };
  if (s.stunned) return { color: 0xfff2a8, mode: 'multiply' };
  if (s.windup) return { color: 0xff8080, mode: 'multiply' };
  if (s.poisoned) return { color: 0xb8ff9a, mode: 'multiply' };
  return null;
}

/** Nearest live target within range, ignoring ids in `skip` (enemies a piercing projectile already hit). */
export function nearestTarget<T extends { id: number; x: number; y: number; alive: boolean }>(
  list: readonly T[], x: number, y: number, maxRange: number, skip: readonly number[],
): T | null {
  let best: T | null = null;
  let bestD = maxRange * maxRange;
  for (const e of list) {
    if (!e.alive || skip.includes(e.id)) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d <= bestD) { best = e; bestD = d; }
  }
  return best;
}

/** How far below the sprite's centre the ground shadow goes: the legendary art is long and leaves empty space below. */
const SHADOW_FACTOR = { hatchling: 0.85, young: 0.85, adult: 0.85, legendary: 0.38 } as const;
export function shadowOffset(id: FormId, displayHeight: number): number {
  return (displayHeight / 2) * SHADOW_FACTOR[id.split('_')[0] as keyof typeof SHADOW_FACTOR];
}

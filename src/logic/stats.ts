import type { Stage } from './types';
import type { Owned } from './upgrades';

export interface PlayerStats { maxHp: number; speed: number; damageMult: number; cooldownMult: number; pickupRadius: number; regen: number; armor: number }

export const BASE_STATS: PlayerStats = { maxHp: 100, speed: 70, damageMult: 1, cooldownMult: 1, pickupRadius: 24, regen: 0, armor: 0 };

export const STAGE_BONUS: Record<Stage, { maxHp: number; damageMult: number; pickupRadius: number }> = {
  0: { maxHp: 0, damageMult: 1, pickupRadius: 0 },
  1: { maxHp: 25, damageMult: 1.3, pickupRadius: 8 },
  2: { maxHp: 50, damageMult: 1.7, pickupRadius: 16 },
  3: { maxHp: 100, damageMult: 2.3, pickupRadius: 24 },
};

export const FALLBACK = { healFraction: 0.3, gold: 5 };

export function computeStats(stage: Stage, owned: Owned): PlayerStats {
  const n = (id: keyof Owned) => owned[id] ?? 0;
  const bonus = STAGE_BONUS[stage];
  return {
    maxHp: BASE_STATS.maxHp + bonus.maxHp + 20 * n('thick_scales'),
    speed: BASE_STATS.speed * (1 + 0.08 * n('swift_wings')),
    damageMult: BASE_STATS.damageMult * bonus.damageMult * (1 + 0.1 * n('fury')),
    cooldownMult: BASE_STATS.cooldownMult * Math.pow(0.92, n('quick_breath')),
    pickupRadius: (BASE_STATS.pickupRadius + bonus.pickupRadius) * (1 + 0.2 * n('magnet')),
    regen: BASE_STATS.regen + 0.5 * n('regen'),
    armor: BASE_STATS.armor + n('ice_armor'),
  };
}

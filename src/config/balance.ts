export type EnemyTypeId = 'squire' | 'archer' | 'lancer' | 'netter' | 'heavy' | 'cleric';

export interface EnemyDef { id: EnemyTypeId; hp: number; speed: number; damage: number; unlockAt: number; weight: number; xp: number; radius: number }

const e = (id: EnemyTypeId, hp: number, speed: number, damage: number, unlockAt: number, weight: number, xp: number, radius: number): EnemyDef =>
  ({ id, hp, speed, damage, unlockAt, weight, xp, radius });

export const ENEMIES: Record<EnemyTypeId, EnemyDef> = {
  squire: e('squire', 12, 30, 5, 0, 10, 1, 8),
  archer: e('archer', 10, 25, 6, 60, 4, 1, 8),
  lancer: e('lancer', 20, 30, 8, 120, 3, 2, 10),
  netter: e('netter', 15, 28, 0, 180, 2, 2, 8),
  heavy: e('heavy', 80, 20, 12, 240, 2, 5, 12),
  cleric: e('cleric', 25, 24, 0, 300, 1, 3, 8),
};

export const ENEMY_IDS = Object.keys(ENEMIES) as EnemyTypeId[];

/** Per-enemy behaviour numbers (Task 8). */
export const ENEMY_AI = {
  contactCooldown: 0.5,
  archer: { keepDistance: 120, fireEvery: 2.5, arrowSpeed: 90, arrowDamage: 6 },
  lancer: { triggerRange: 100, windup: 0.4, dashSpeed: 140, dashTime: 0.6 },
  netter: { range: 110, throwEvery: 4, netSpeed: 100, slowDuration: 1.5 },
  cleric: { keepDistance: 80, healEvery: 2, healAmount: 5, healRange: 60 },
  separation: { radius: 10, maxNeighbors: 4 },
  maxSpawnsPerFrame: 10,
  despawnFactor: 1.5,
};

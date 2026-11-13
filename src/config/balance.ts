export type EnemyTypeId = 'squire' | 'archer' | 'lancer' | 'netter' | 'heavy' | 'cleric';

export interface EnemyDef { id: EnemyTypeId; hp: number; speed: number; damage: number; unlockAt: number; weight: number; xp: number; radius: number }

const e = (id: EnemyTypeId, hp: number, speed: number, damage: number, unlockAt: number, weight: number, xp: number, radius: number): EnemyDef =>
  ({ id, hp, speed, damage, unlockAt, weight, xp, radius });

export const ENEMIES: Record<EnemyTypeId, EnemyDef> = {
  squire: e('squire', 10, 30, 5, 0, 10, 1, 8),
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
  despawnFactor: 1.5,
};

/** Fixed numbers of the player's attacks. Per-level numbers live in src/logic/attacks.ts. */
export const PLAYER_WEAPONS = {
  spit: { range: 160, speed: 220 },
  fireBreath: { range: 160, speed: 180 },
  fireZone: { duration: 2, goldDuration: 2, tick: 0.5, damage: 5, goldDamage: 1.5, max: 40 },
  iceBreath: { range: 160, speed: 200, spreadDeg: 15 },
  lightningBreath: { range: 140, decay: 0.7, goldDecay: 0.9, scanRadius: 320 },
  fireOrbit: { hitRadius: 7 },
  frostShards: { speed: 160, life: 1.2, goldFreeze: 1.5 },
  frostAura: { goldFreeze: 1.5, goldFreezeEvery: 4 },
  ultimate: { every: 20, fireRadius: 120, fireDamage: 80, iceFreeze: 3, lightningStrikes: 12, lightningDamage: 60 },
  evolution: { pause: 0.8, pushRadius: 100, pushDistance: 60 },
};

export const PICKUPS = { goldChance: 0.1, flySpeed: 200, collectDistance: 6 };

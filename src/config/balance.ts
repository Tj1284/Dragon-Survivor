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

/** Player attacks (Tasks 9-10). */
export const PLAYER_WEAPONS = {
  spit: { cooldown: 0.7, range: 160, speed: 220, damage: 12 },
  fireBreath: { cooldown: 0.9, range: 160, speed: 180, damage: 14 },
  fireZone: { radius: 18, radiusPerLevel: 0.15, duration: 2, durationPerLevel: 0.5, tick: 0.5, damage: 5, damagePerLevel: 0.25, max: 40 },
  fireBurst: { chancePerLevel: 0.1, radius: 24, damage: 10 },
  iceBreath: { cooldown: 0.8, range: 160, speed: 200, damage: 8, shards: 3, spreadDeg: 15, baseSlow: 0.4, slowPerLevel: 0.1 },
  frostAura: { radius: 40, slowPerLevel: 0.2, maxSlow: 0.6 },
  lightningBreath: { cooldown: 0.9, cooldownPerLevel: 0.9, range: 140, damage: 12, chainRange: 60, chainRangePerLevel: 0.15, decay: 0.7, decayPerLevel: 0.1, maxDecay: 0.95, scanRadius: 320 },
  fireOrbit: { radius: 36, angularSpeed: 2, damage: 6, hitCooldown: 0.5, hitRadius: 7 },
  frostShards: { every: 2, speed: 160, damage: 7, life: 1.2 },
  thunderStrike: { base: 3.5, perLevel: 0.3, damage: 20, radius: 16 },
  ultimate: { every: 20, fireRadius: 120, fireDamage: 80, iceFreeze: 3, lightningStrikes: 12, lightningDamage: 60 },
  evolution: { pause: 0.8, pushRadius: 100, pushDistance: 60 },
};

export const PICKUPS = { goldChance: 0.1, flySpeed: 200, collectDistance: 6 };

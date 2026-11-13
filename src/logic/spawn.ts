import { ENEMIES, ENEMY_IDS, type EnemyTypeId } from '../config/balance';

/** Enemies the director keeps alive: a gentle start that curves up to the 300 cap near the end of a 10-minute run. */
export function targetAlive(tSeconds: number): number {
  return Math.min(300, Math.floor(4 + 0.12 * tSeconds + 0.0007 * tSeconds * tSeconds));
}

/** Spawns per second: enemies trickle in instead of appearing in bursts. */
export function spawnRate(tSeconds: number): number {
  return Math.min(12, 1 + tSeconds / 40);
}

/** Accumulates fractional spawns over time; returns how many to spawn this frame and the budget left. */
export function stepSpawnBudget(budget: number, dt: number, tSeconds: number, missing: number): { budget: number; count: number } {
  const next = budget + spawnRate(tSeconds) * dt;
  if (missing <= 0) return { budget: Math.min(next, 1), count: 0 };
  const count = Math.min(Math.floor(next + 1e-9), missing);
  return { budget: next - count, count };
}

export function hpMult(tSeconds: number): number {
  return 1 + tSeconds / 180;
}

export function pickEnemyType(tSeconds: number, rng: () => number): EnemyTypeId {
  const unlocked = ENEMY_IDS.filter((id) => ENEMIES[id].unlockAt <= tSeconds);
  const total = unlocked.reduce((s, id) => s + ENEMIES[id].weight, 0);
  let roll = rng() * total;
  for (const id of unlocked) {
    roll -= ENEMIES[id].weight;
    if (roll < 0) return id;
  }
  return unlocked[unlocked.length - 1];
}

export function spawnRadius(viewW: number, viewH: number): number {
  return Math.hypot(viewW, viewH) / 2 + 20;
}

export function spawnPosition(cx: number, cy: number, viewW: number, viewH: number, rng: () => number): { x: number; y: number } {
  const angle = rng() * Math.PI * 2;
  const r = spawnRadius(viewW, viewH);
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
}

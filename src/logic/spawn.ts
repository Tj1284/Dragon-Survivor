import { ENEMIES, ENEMY_IDS, type EnemyTypeId } from '../config/balance';

export function targetAlive(tSeconds: number): number {
  return Math.min(300, Math.floor(15 + 0.5 * tSeconds));
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

// Projectile on-hit effects must use the time of impact, not the time of firing (review finding 4).
import { dbg, open, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'spawn', 'netter', 1, 105);   // in throwing range; the net needs ~1 s to arrive
  await dbg(page, 'setEnemyHp', 1e9);
  await waitFor(page, () => window.__dbg.player().slowUntil > 0, null, 8000);
  const p = await dbg(page, 'player');
  const left = p.slowUntil - p.now;
  if (left < 1.3) throw new Error(`net slow should last ~1.5 s from impact, only ${left.toFixed(2)} s left right after the hit`);
}

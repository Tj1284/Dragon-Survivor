// Floating damage numbers appear on hits and stay capped in big fights.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'spawnDummies', 'squire', 3, 40);
  await waitFor(page, () => window.__dbg.damageNumbers().active > 0, null, 3000)
    .catch(() => { throw new Error('hits should show damage numbers'); });
  await page.screenshot({ path: 'e2e/out/damage-numbers.png' });
  await dbg(page, 'spawnDummies', 'squire', 300, 35);
  await dbg(page, 'give', 'frost_aura');
  await dbg(page, 'give', 'fire_orbit');
  let peak = 0;
  for (let i = 0; i < 20; i++) { peak = Math.max(peak, (await dbg(page, 'damageNumbers')).active); await sleep(50); }
  if (peak > 24) throw new Error('too many damage numbers at once: ' + peak);
  // numbers are never recycled while still young, so they don't flicker in big fights
  const stats = await dbg(page, 'damageNumbers');
  if (stats.recycledYoung > 0) throw new Error('damage numbers recycled before 0.2 s: ' + stats.recycledYoung);
  // one burst in a single frame shows at most 6
  const n0 = (await dbg(page, 'damageNumbers')).shownTotal;
  await dbg(page, 'burstDamageNumbers', 50);
  const n1 = (await dbg(page, 'damageNumbers')).shownTotal;
  if (n1 - n0 > 6) throw new Error('more than 6 numbers in one frame: ' + (n1 - n0));
}

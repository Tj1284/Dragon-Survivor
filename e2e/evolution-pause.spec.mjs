// The 0.8 s evolution pause must also happen when the evolution comes from real level-up picks (review finding 3).
import { dbg, open, sleep } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'chooseElementNext', 'fire');
  await dbg(page, 'addXp', 44); // level 1 → 5: four level-up screens, then the first evolution
  for (let i = 0; i < 10; i++) {
    await sleep(120);
    if (!(await dbg(page, 'scene')).includes('LevelUp')) break;
    await dbg(page, 'pick', 0);
  }
  await page.waitForFunction(() => window.__dbg.player().formId !== 'hatchling', null, { timeout: 2000 });
  const t0 = (await dbg(page, 'run')).elapsed;
  await sleep(400);
  const t1 = (await dbg(page, 'run')).elapsed;
  if (t1 - t0 > 0.15) throw new Error(`game kept running during the evolution pause (+${(t1 - t0).toFixed(2)} s)`);
  await sleep(1000);
  const t2 = (await dbg(page, 'run')).elapsed;
  if (!(t2 > t1 + 0.3)) throw new Error('game did not resume after the evolution pause');
}

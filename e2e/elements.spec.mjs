// The poison and shadow elements: their status effects and attacks.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

async function quiet(page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
}

export default async function (page, baseUrl) {
  // poison ticks kill, and each poisoned death counts once
  await quiet(page, baseUrl);
  await dbg(page, 'spawnDummies', 'squire', 6, 260);
  await dbg(page, 'freezeEnemies');
  await dbg(page, 'setEnemyHp', 12);
  await dbg(page, 'poisonAll', 20, 3);
  if ((await dbg(page, 'poisonedCount')) !== 6) throw new Error('all 6 should be poisoned: ' + (await dbg(page, 'poisonedCount')));
  await waitFor(page, () => window.__dbg.enemies() === 0, null, 3000);
  await sleep(300);
  if ((await dbg(page, 'kills')) !== 6) throw new Error('6 poisoned deaths should count 6 kills: ' + (await dbg(page, 'kills')));

  // plague: a poisoned enemy that dies passes its poison to its neighbours
  await quiet(page, baseUrl);
  await dbg(page, 'setPlague', 60);
  await dbg(page, 'spawnAt', 'squire', 260, 0);
  await dbg(page, 'setEnemyHp', 4);
  await dbg(page, 'poisonAll', 20, 3);
  for (const [dx, dy] of [[280, 0], [240, 0], [260, 20], [260, -20]]) await dbg(page, 'spawnAt', 'squire', dx, dy);
  await dbg(page, 'freezeEnemies');
  if ((await dbg(page, 'poisonedCount')) !== 1) throw new Error('only the first enemy starts poisoned');
  await waitFor(page, () => window.__dbg.kills() >= 1, null, 3000);
  await sleep(100);
  const spread = await dbg(page, 'poisonedCount');
  if (spread !== 4) throw new Error('the plague should reach the 4 neighbours: ' + spread);
}

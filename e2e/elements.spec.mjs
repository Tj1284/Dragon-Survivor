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

  // poison dragon: the clouds and spines poison the horde
  await quiet(page, baseUrl);
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'chooseElementNext', 'poison');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.player().formId === 'young_poison', null, 4000);
  await dbg(page, 'give', 'toxic_cloud');
  await dbg(page, 'give', 'venom_spines');
  if (!(await dbg(page, 'attacks')).some((a) => a.id === 'poison_breath')) throw new Error('the spit should become the venom breath');
  await dbg(page, 'spawnDummies', 'heavy', 8, 30);
  await sleep(2500);
  const ps = await dbg(page, 'weaponStats');
  const hits = await dbg(page, 'hitsBySource');
  if (!(ps.clouds > 0 && ps.spines > 0 && hits.toxic_cloud > 0 && hits.venom_spines > 0 && hits.poison > 0)) throw new Error('poison attacks should hit and poison: ' + JSON.stringify({ ps, hits }));
  await page.screenshot({ path: 'e2e/out/poison.png' });

  // shadow dragon: the reaper finishes off the weak, the rift drags enemies in
  await quiet(page, baseUrl);
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'chooseElementNext', 'shadow');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.player().formId === 'young_shadow', null, 4000);
  await dbg(page, 'give', 'reaper');
  await dbg(page, 'give', 'void_rift');
  await dbg(page, 'spawnDummies', 'heavy', 8, 30);
  await dbg(page, 'setEnemyHp', 70); // frozen dummies take x1.5: one sweep leaves them weak but alive
  await waitFor(page, () => window.__dbg.weaponStats().executed > 0, null, 4000)
    .catch(async () => { throw new Error('the reaper should execute weakened enemies: ' + JSON.stringify(await dbg(page, 'weaponStats'))); });
  // the executed enemies dropped xp: close any level-up screen so the game keeps running
  await dbg(page, 'clearPickups');
  await sleep(300);
  while ((await dbg(page, 'scene')).includes('LevelUp')) { await dbg(page, 'pick', 0); await sleep(300); }
  await dbg(page, 'clearEnemies');
  await dbg(page, 'spawnDummies', 'squire', 12, 30);
  await waitFor(page, () => window.__dbg.weaponStats().pulled > 0, null, 6000)
    .catch(async () => { throw new Error('the void rift should pull enemies: ' + JSON.stringify(await dbg(page, 'weaponStats'))); });
  await page.screenshot({ path: 'e2e/out/shadow.png' });

  // bosses are never executed
  await dbg(page, 'clearEnemies');
  const before = (await dbg(page, 'weaponStats')).executed;
  await dbg(page, 'setElapsed', 179.5);
  await waitFor(page, () => window.__dbg.bosses().length > 0, null, 3000);
  await dbg(page, 'setEnemyHp', 60); // far below 10% of the boss's health
  const reaperBefore = (await dbg(page, 'hitsBySource')).reaper ?? 0;
  await waitFor(page, (n) => (window.__dbg.hitsBySource().reaper ?? 0) > n || window.__dbg.bosses().length === 0, reaperBefore, 8000);
  if ((await dbg(page, 'weaponStats')).executed !== before) throw new Error('a boss was executed');
}

// Mini-bosses at 3:00 and 6:00 drop a chest; the final boss at 10:00 ends the run in victory.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

async function pickAll(page) {
  let n = 0;
  for (let i = 0; i < 10; i++) {
    await sleep(200);
    if (!(await dbg(page, 'scene')).includes('LevelUp')) break;
    await dbg(page, 'pick', 0);
    n++;
  }
  return n;
}

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);

  // captain at 3:00, with its health bar
  await dbg(page, 'setElapsed', 179.5);
  await waitFor(page, () => window.__dbg.bosses().some((b) => b.id === 'captain'), null, 3000);
  const bar = (await dbg(page, 'hud')).bossBar;
  if (!bar.visible) throw new Error('boss health bar should be visible');
  await page.screenshot({ path: 'e2e/out/boss-captain.png' });

  // killing it drops a chest; the chest gives exactly one level-up
  await dbg(page, 'damageBoss', 1e9);
  await waitFor(page, () => window.__dbg.pickups().some((p) => p.kind === 'chest'), null, 2000);
  await waitFor(page, () => !window.__dbg.hud().bossBar.visible, null, 1000)
    .catch(() => { throw new Error('boss bar should hide when the boss dies'); });
  const chest = (await dbg(page, 'pickups')).find((p) => p.kind === 'chest');
  const lvl0 = (await dbg(page, 'run')).level;
  await dbg(page, 'teleport', chest.x, chest.y);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  if ((await pickAll(page)) !== 1) throw new Error('a chest should give exactly one upgrade');
  if ((await dbg(page, 'run')).level !== lvl0) throw new Error('a chest must not change the player level');

  // risk 4: two chests in a row give two upgrades
  await dbg(page, 'dropChest');
  await dbg(page, 'dropChest');
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  if ((await pickAll(page)) !== 2) throw new Error('two chests should give two upgrades');

  // risk 3: a boss that comes due while the level-up screen is open appears once, after it closes
  const r = await dbg(page, 'run');
  await dbg(page, 'addXp', 5 + 4 * (r.level - 1) - r.xp);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  await dbg(page, 'setElapsed', 359.9);
  await sleep(500);
  if ((await dbg(page, 'bosses')).length !== 0) throw new Error('boss appeared while the game was paused');
  await pickAll(page);
  await waitFor(page, () => window.__dbg.bosses().some((b) => b.id === 'champion'), null, 3000);
  await sleep(1000);
  if ((await dbg(page, 'bosses')).filter((b) => b.id === 'champion').length !== 1) throw new Error('champion should appear exactly once');
  await dbg(page, 'damageBoss', 1e9);
  await sleep(300);
  await dbg(page, 'clearPickups');

  // final boss uses its patterns, and beating it is a victory
  await dbg(page, 'setElapsed', 599.5);
  await waitFor(page, () => window.__dbg.bosses().some((b) => b.id === 'grand_hunter'), null, 3000);
  await sleep(9000);
  const used = await dbg(page, 'bossPatterns');
  if (new Set(used).size < 2) throw new Error('final boss should use at least 2 patterns: ' + used.join(','));
  await page.screenshot({ path: 'e2e/out/boss-final.png' });
  await dbg(page, 'damageBoss', 1e9);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 4000);
  const over = await dbg(page, 'gameOver');
  if (!over.won) throw new Error('beating the final boss should be a victory: ' + JSON.stringify(over));
  await page.screenshot({ path: 'e2e/out/victory.png' });
}

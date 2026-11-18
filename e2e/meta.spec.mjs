// Menu, Lair and Collection, and the save that ties runs together.
import { clickGame, dbg, sleep, waitFor } from './helpers.mjs';

async function boot(page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
}
const scenes = (page) => dbg(page, 'scene');
async function tap(page, id) {
  const b = (await dbg(page, 'buttons')).find((x) => x.id === id);
  if (!b) throw new Error(`button ${id} not on screen: ${JSON.stringify(await dbg(page, 'buttons'))}`);
  await clickGame(page, b.x, b.y);
}
async function die(page) {
  await dbg(page, 'setHp', 0.1);
  await dbg(page, 'spawn', 'heavy', 3, 5);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 4000);
}

export default async function (page, baseUrl) {
  // first visit: straight into a run, no menu
  await boot(page, baseUrl);
  await dbg(page, 'resetSave');
  await page.reload();
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  if (!(await scenes(page)).includes('Game')) throw new Error('first visit should start a run: ' + (await scenes(page)));
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');

  // the run's gold is saved once, even if the game-over screen is rebuilt by a rotation (risk 2)
  await dbg(page, 'setGold', 12);
  await die(page);
  let save = await dbg(page, 'save');
  if (save.gold !== 12 || !save.played) throw new Error('run result not saved: ' + JSON.stringify(save));
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(500);
  await page.setViewportSize({ width: 960, height: 540 });
  await sleep(500);
  save = await dbg(page, 'save');
  if (save.gold !== 12) throw new Error('gold added twice after rotating: ' + save.gold);
  await page.screenshot({ path: 'e2e/out/gameover.png' });
  await tap(page, 'menu');
  await waitFor(page, () => window.__dbg.scene().includes('Menu'), null, 2000);

  // from now on the game opens on the menu
  await page.reload();
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  if (!(await scenes(page)).includes('Menu')) throw new Error('a returning player should land on the menu');
  await page.screenshot({ path: 'e2e/out/menu.png' });

  // lair: buying spends gold and persists; rapid taps can't overspend (risk 5)
  await dbg(page, 'setSave', { gold: 100 });
  await tap(page, 'lair');
  await waitFor(page, () => window.__dbg.scene().includes('Lair'), null, 2000);
  await tap(page, 'buy_might');
  await sleep(200);
  save = await dbg(page, 'save');
  if (save.gold !== 70 || save.meta.might !== 1) throw new Error('buy failed: ' + JSON.stringify(save));
  for (let i = 0; i < 3; i++) await tap(page, 'buy_might');
  await sleep(200);
  save = await dbg(page, 'save');
  if (save.gold !== 70 || save.meta.might !== 1) throw new Error('bought without enough gold: ' + JSON.stringify(save));
  await page.screenshot({ path: 'e2e/out/lair.png' });
  await page.reload();
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  save = await dbg(page, 'save');
  if (save.gold !== 70 || save.meta.might !== 1) throw new Error('lair purchase lost on reload: ' + JSON.stringify(save));

  // collection shows what has been reached
  await dbg(page, 'setSave', { collection: ['hatchling', 'young_ice'] });
  await tap(page, 'collection');
  await waitFor(page, () => window.__dbg.scene().includes('Collection'), null, 2000);
  if ((await dbg(page, 'collectionCount')) !== 2) throw new Error('collection should show 2/10');
  await page.screenshot({ path: 'e2e/out/collection.png' });
  await tap(page, 'back');
  await waitFor(page, () => window.__dbg.scene().includes('Menu'), null, 2000);

  // lair bonus applies to a new run, and evolving adds to the collection
  await dbg(page, 'setSave', { meta: { vitality: 2 } });
  await tap(page, 'play');
  await waitFor(page, () => window.__dbg.scene().includes('Game'), null, 2000);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  if ((await dbg(page, 'player')).maxHp !== 120) throw new Error('vitality should give 120 max health');
  await dbg(page, 'chooseElementNext', 'fire');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.player().formId === 'young_fire', null, 4000);
  await sleep(1000);
  await die(page);
  save = await dbg(page, 'save');
  if (!save.collection.includes('young_fire')) throw new Error('young_fire should be in the collection: ' + JSON.stringify(save.collection));
}

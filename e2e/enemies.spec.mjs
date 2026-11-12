import { clickGame, dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'spawn', 'squire', 5, 20);
  await sleep(2000);
  const hp = (await dbg(page, 'player')).hp;
  if (!(hp < 100)) throw new Error('squires did not hurt the dragon, hp=' + hp);

  await dbg(page, 'setHp', 1);
  await dbg(page, 'spawn', 'heavy', 3, 10);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000);
  const btn = await dbg(page, 'againButton');
  await clickGame(page, btn.x, btn.y);
  await waitFor(page, () => window.__dbg.scene().includes('Game') && !window.__dbg.scene().includes('GameOver'), null, 3000);
  await waitFor(page, () => window.__dbg.player().hp === 100, null, 3000);

  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'pauseSpawns', false);
  await dbg(page, 'setElapsed', 300);
  await sleep(10000);
  const types = await dbg(page, 'enemyTypes');
  await page.screenshot({ path: 'e2e/out/enemies-min5.png' });
  if ((await dbg(page, 'scene')).includes('GameOver')) throw new Error('dragon died during the wait');
  if (types.length < 4) throw new Error('expected ≥4 enemy types at minute 5, got ' + types.join(','));
}

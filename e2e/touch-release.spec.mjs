// Lifting the joystick finger must not press whatever button appeared under it (review finding 2).
import { clickGame, dbg, open, sleep, toPage, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);

  // level-up opens while the finger holds the joystick over where the middle card will be
  const start = await toPage(page, 240, 150);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y, { steps: 3 });
  await dbg(page, 'addXp', 5);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  await page.mouse.up();
  await sleep(300);
  let run = await dbg(page, 'run');
  if (JSON.stringify(run.owned) !== '{"spit":1}') throw new Error('a card was picked by lifting the joystick finger: ' + JSON.stringify(run.owned));
  if (!(await dbg(page, 'scene')).includes('LevelUp')) throw new Error('level-up screen closed by the finger lift');

  // a real tap on a card still works
  const cards = await dbg(page, 'cards');
  await clickGame(page, cards[1].x, cards[1].y);
  await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);
  run = await dbg(page, 'run');
  if (JSON.stringify(run.owned) === '{"spit":1}') throw new Error('tap on a card did not pick it');

  // dying mid-drag must not skip the game-over summary
  const again = { x: 240, y: 216 };
  const a = await toPage(page, again.x, again.y);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 10, a.y, { steps: 3 });
  await dbg(page, 'setHp', 0.5);
  await dbg(page, 'spawn', 'heavy', 2, 5);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000);
  const btn = await dbg(page, 'againButton');
  const b = await toPage(page, btn.x, btn.y);
  await page.mouse.move(b.x, b.y);
  await page.mouse.up();
  await sleep(300);
  if (!(await dbg(page, 'scene')).includes('GameOver')) throw new Error('game-over screen skipped by the finger lift');
}

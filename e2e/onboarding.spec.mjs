// First run teaches the controls; later runs don't. A loading screen covers the start instead of a blank page.
import { dbg, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  if ((await page.locator('#loading').count()) !== 1) throw new Error('loading screen should be in the page');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  await waitFor(page, () => !document.getElementById('loading'), null, 2000)
    .catch(() => { throw new Error('loading screen should go away once the game is ready'); });

  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  let hint = (await dbg(page, 'hud')).hint;
  if (!hint.visible || !/WASD|mover|move/i.test(hint.text)) throw new Error('first run should show the controls hint: ' + JSON.stringify(hint));
  await page.screenshot({ path: 'e2e/out/hint.png' });
  await page.keyboard.down('d'); await sleep(1200); await page.keyboard.up('d');
  hint = (await dbg(page, 'hud')).hint;
  if (hint.visible) throw new Error('hint should hide once the dragon has moved');

  // the next run has no hint
  await dbg(page, 'setHp', 0.1);
  await dbg(page, 'spawn', 'heavy', 3, 5);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 4000);
  const again = (await dbg(page, 'buttons')).find((b) => b.id === 'again');
  await page.keyboard.press('Enter');
  await waitFor(page, () => window.__dbg.scene().includes('Game') && !window.__dbg.scene().includes('GameOver'), null, 3000);
  await sleep(300);
  if ((await dbg(page, 'hud')).hint.visible) throw new Error('the hint must not come back after the first run');
  void again;
}

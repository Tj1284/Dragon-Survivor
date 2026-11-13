// Rotating the phone while an overlay is open must keep its buttons on screen and usable (review finding 1).
import { clickGame, dbg, open, sleep, waitFor } from './helpers.mjs';

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

async function rotate(page, vp) {
  await page.setViewportSize(vp);
  const want = vp.width > vp.height ? { w: 584, h: 270 } : { w: 270, h: 584 };
  await waitFor(page, (w) => { const s = window.__dbg.size(); return s.width === w.w && s.height === w.h; }, want, 2000);
  await sleep(300);
}
async function assertOnScreen(page, pt, what) {
  const s = await dbg(page, 'size');
  if (!(pt.x > 0 && pt.x < s.width && pt.y > 0 && pt.y < s.height)) throw new Error(`${what} off screen after rotating: ${JSON.stringify(pt)} in ${JSON.stringify(s)}`);
}

export default async function (page, baseUrl) {
  // Pause: portrait → landscape
  await page.setViewportSize(PORTRAIT);
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await page.keyboard.press('Escape');
  await waitFor(page, () => window.__dbg.scene().includes('Pause'), null, 2000);
  await rotate(page, LANDSCAPE);
  const resume = await dbg(page, 'resumeButton');
  await assertOnScreen(page, resume, 'Resume button');
  await clickGame(page, resume.x, resume.y);
  await waitFor(page, () => !window.__dbg.scene().includes('Pause'), null, 2000);

  // Level-up: landscape → portrait
  await dbg(page, 'addXp', 5);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  await rotate(page, PORTRAIT);
  const cards = await dbg(page, 'cards');
  for (const c of cards) await assertOnScreen(page, c, 'card');
  await page.screenshot({ path: 'e2e/out/levelup-rotated.png' });
  await clickGame(page, cards[2].x, cards[2].y);
  await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);

  // Game over: portrait → landscape
  await dbg(page, 'setHp', 0.5);
  await dbg(page, 'spawn', 'heavy', 2, 5);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000);
  await rotate(page, LANDSCAPE);
  const again = await dbg(page, 'againButton');
  await assertOnScreen(page, again, 'Again button');
  await clickGame(page, again.x, again.y);
  await waitFor(page, () => window.__dbg.scene().includes('Game') && !window.__dbg.scene().includes('GameOver'), null, 3000);
}

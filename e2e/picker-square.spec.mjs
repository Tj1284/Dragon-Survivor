// Playgama 1.6.8: in a square window the element picker still fits, with nothing overlapping.
import { dbg, open, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await page.setViewportSize({ width: 600, height: 600 });
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'give', 'fury');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  const cards = await dbg(page, 'cards');
  if (cards.length !== 5) throw new Error('5 element cards expected');
  const size = await dbg(page, 'size');
  for (const c of cards) if (c.x < 0 || c.x > size.width || c.y < 0 || c.y > size.height) throw new Error('card off screen: ' + JSON.stringify(c));
  await page.screenshot({ path: 'e2e/out/picker-square.png' });
  await page.setViewportSize({ width: 960, height: 540 });
}

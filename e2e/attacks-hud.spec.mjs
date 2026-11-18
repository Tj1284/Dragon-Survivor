// The HUD shows the attacks the dragon holds; the gold card is protected like any other card.
import { clickGame, dbg, open, sleep, toPage, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);

  let icons = (await dbg(page, 'hud')).attacks;
  if (icons.length !== 1 || icons[0].id !== 'spit' || icons[0].level !== 1 || icons[0].gold) throw new Error('HUD should show the spit: ' + JSON.stringify(icons));
  await dbg(page, 'give', 'roar');
  await dbg(page, 'give', 'frost_aura');
  for (let i = 0; i < 5; i++) await dbg(page, 'give', 'frost_shards');
  icons = (await dbg(page, 'hud')).attacks;
  if (icons.length !== 4) throw new Error('HUD should show 4 attacks: ' + JSON.stringify(icons));
  if (icons.find((a) => a.id === 'frost_shards').level !== 5) throw new Error('HUD level not updated');

  // gold card opens while the finger holds the joystick: lifting it must not pick it (risk 4)
  await dbg(page, 'give', 'fury');
  const start = await toPage(page, 100, 150);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y, { steps: 3 });
  const r = await dbg(page, 'run');
  await dbg(page, 'addXp', 5 + 4 * (r.level - 1) - r.xp);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  const cards = await dbg(page, 'cards');
  if (cards[0].type !== 'gold') throw new Error('expected the gold card first');
  const c0 = await toPage(page, cards[0].x, cards[0].y);
  await page.mouse.move(c0.x, c0.y);
  await page.mouse.up();
  await sleep(300);
  if ((await dbg(page, 'run')).goldAttacks.length !== 0) throw new Error('gold card picked by lifting the joystick finger');
  await page.screenshot({ path: 'e2e/out/gold-card.png' });
  await clickGame(page, cards[0].x, cards[0].y);
  await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);
  icons = (await dbg(page, 'hud')).attacks;
  if (!icons.find((a) => a.id === 'frost_shards').gold) throw new Error('HUD should mark frost_shards as gold: ' + JSON.stringify(icons));
  await page.screenshot({ path: 'e2e/out/hud-attacks.png' });

  // portrait: every icon stays on screen
  await page.setViewportSize({ width: 390, height: 844 });
  await waitFor(page, () => window.__dbg.size().width === 270, null, 2000);
  await sleep(300);
  icons = (await dbg(page, 'hud')).attacks;
  for (const a of icons) if (!(a.x > 8 && a.x < 262)) throw new Error('icon off screen in portrait: ' + JSON.stringify(a));
}

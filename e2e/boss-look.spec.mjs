// Bosses stay readable under constant fire, and an off-screen chest gets an arrow at the screen edge.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'setElapsed', 179.5);
  await waitFor(page, () => window.__dbg.bosses().length === 1, null, 3000);
  await dbg(page, 'resetBossFlash');
  for (let i = 0; i < 40; i++) { await dbg(page, 'shootBossAt', 0); await sleep(50); }
  const ratio = await dbg(page, 'bossFlashRatio');
  if (!(ratio < 0.4)) throw new Error('boss is white most of the time under fire: ' + ratio.toFixed(2));

  // chest arrow
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  if ((await dbg(page, 'hud')).chestArrow.visible) throw new Error('no chest, no arrow');
  await dbg(page, 'dropChestAt', 400, 0);
  await sleep(200);
  const arrow = (await dbg(page, 'hud')).chestArrow;
  if (!arrow.visible || !(arrow.x > 400)) throw new Error('arrow should point right, at the screen edge: ' + JSON.stringify(arrow));
  await page.screenshot({ path: 'e2e/out/chest-arrow.png' });
  const chest = (await dbg(page, 'pickups')).find((p) => p.kind === 'chest');
  await dbg(page, 'teleport', chest.x, chest.y);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  await dbg(page, 'pick', 0);
  await sleep(300);
  if ((await dbg(page, 'hud')).chestArrow.visible) throw new Error('arrow should hide once the chest is picked up');
}

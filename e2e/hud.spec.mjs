import { clickGame, dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'setHp', 1e9);
  const s1 = await dbg(page, 'size');
  if (s1.width !== 480 || s1.height !== 270) throw new Error('landscape size ' + JSON.stringify(s1));
  let hud = await dbg(page, 'hud');
  if (hud.timer.x !== 240) throw new Error('timer not centered: ' + hud.timer.x);
  await sleep(1200);
  await page.screenshot({ path: 'e2e/out/hud-landscape.png' });

  // rotate to portrait mid-run (risk 5)
  await page.setViewportSize({ width: 390, height: 844 });
  await waitFor(page, () => { const s = window.__dbg.size(); return s.width === 270 && s.height === 584; }, null, 2000)
    .catch(async () => { throw new Error('portrait size ' + JSON.stringify(await dbg(page, 'size'))); });
  await sleep(300);
  hud = await dbg(page, 'hud');
  if (hud.timer.x !== 135) throw new Error('portrait timer x ' + hud.timer.x);
  if (!(hud.pause.x > 240)) throw new Error('pause button not at right edge: ' + hud.pause.x);
  const cam = await dbg(page, 'camera');
  const p = await dbg(page, 'player');
  if (Math.abs(p.x - cam.midX) > 2 || Math.abs(p.y - cam.midY) > 2) throw new Error(`dragon not centered: ${JSON.stringify({ p, cam })}`);
  await page.screenshot({ path: 'e2e/out/hud-portrait.png' });

  // pause with Escape: time stops; Resume continues
  await page.keyboard.press('Escape');
  await waitFor(page, () => window.__dbg.scene().includes('Pause'), null, 2000);
  const t0 = (await dbg(page, 'run')).elapsed;
  await sleep(1000);
  const t1 = (await dbg(page, 'run')).elapsed;
  if (t1 !== t0) throw new Error('time advanced while paused');
  const btn = await dbg(page, 'resumeButton');
  await clickGame(page, btn.x, btn.y);
  await waitFor(page, () => !window.__dbg.scene().includes('Pause'), null, 2000);
  await sleep(500);
  if (!((await dbg(page, 'run')).elapsed > t1)) throw new Error('time did not resume');

  // pause button in the HUD also works
  await clickGame(page, hud.pause.x, hud.pause.y);
  await waitFor(page, () => window.__dbg.scene().includes('Pause'), null, 2000);
}

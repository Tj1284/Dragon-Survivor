// The Lair stays readable on every screen shape: each row's texts stay inside its row.
import { dbg, sleep } from './helpers.mjs';

const SIZES = [[960, 540], [1024, 768], [390, 844], [844, 390], [768, 1024]];

export default async function (page, baseUrl) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'es-ES' }));
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  await dbg(page, 'setSave', { played: true, gold: 60 });
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => window.__dbg.game.scene.getScenes(true)[0].scene.start('Lair'));
    await sleep(400);
    const rows = await dbg(page, 'lairRows');
    for (const r of rows) {
      for (const [name, t] of Object.entries(r.texts)) {
        if (t.top < r.top - 1 || t.bottom > r.bottom + 1) throw new Error(`${w}x${h}: ${name} of ${r.id} spills out of its row (${JSON.stringify(t)} vs ${r.top}-${r.bottom})`);
      }
    }
    await page.screenshot({ path: `e2e/out/lair-${w}x${h}.png` });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export default async function (page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  await page.evaluate(() => window.__dbg.pauseSpawns?.(true));
  const x0 = (await page.evaluate(() => window.__dbg.player())).x;
  await page.keyboard.down('d'); await sleep(1000); await page.keyboard.up('d');
  const x1 = (await page.evaluate(() => window.__dbg.player())).x;
  if (!(x1 - x0 >= 50 && x1 - x0 <= 90)) throw new Error(`keyboard move dx=${x1 - x0}`);
  // joystick: press and drag without releasing, then the window loses focus → stick must release (risk 4)
  await page.mouse.move(300, 200); await page.mouse.down(); await page.mouse.move(380, 200, { steps: 5 });
  await sleep(200);
  const xa = (await page.evaluate(() => window.__dbg.player())).x;
  await sleep(200);
  const xb = (await page.evaluate(() => window.__dbg.player())).x;
  if (!(xb > xa)) throw new Error('joystick did not move the dragon');
  await page.evaluate(() => window.__dbg.blur());
  const j = await page.evaluate(() => window.__dbg.joystick());
  if (j.active) throw new Error('joystick still active after blur');
  const xc = (await page.evaluate(() => window.__dbg.player())).x; await sleep(300);
  const xd = (await page.evaluate(() => window.__dbg.player())).x;
  if (Math.abs(xd - xc) > 0.5) throw new Error(`still moving after blur: ${xd - xc}`);
  await page.mouse.up();
}

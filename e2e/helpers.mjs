export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__dbg[f](...a), [fn, args]);
export async function open(page, baseUrl, query = '') {
  await page.goto(baseUrl + '/?debug=1' + query);
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
}
export async function waitFor(page, predicate, arg, timeout = 5000) {
  try {
    await page.waitForFunction(predicate, arg, { timeout, polling: 50 });
  } catch (e) {
    throw new Error(`timed out (${timeout}ms) waiting for: ${predicate.toString().slice(0, 120)}`);
  }
}
/** Clicks a point given in game (screen-space) coordinates. */
export async function clickGame(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  const size = await dbg(page, 'size');
  await page.mouse.click(box.x + (x * box.width) / size.width, box.y + (y * box.height) / size.height);
}

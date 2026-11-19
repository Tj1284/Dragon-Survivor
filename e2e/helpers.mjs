export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function dbg(page, fn, ...args) {
  try {
    return await page.evaluate(([f, a]) => window.__dbg[f](...a), [fn, args]);
  } catch (e) {
    // add the game state to the error: most failures here mean the run ended or a scene changed unexpectedly
    const state = await page.evaluate(() => {
      const safe = (f) => { try { return f(); } catch (err) { return 'ERR ' + err.message; } };
      return { scenes: safe(() => window.__dbg.scene()), player: safe(() => window.__dbg.player()), over: safe(() => window.__dbg.gameOver?.()), run: safe(() => window.__dbg.run()) };
    }).catch((err) => 'state unavailable: ' + err.message);
    throw new Error(`${fn}(${JSON.stringify(args)}) failed: ${e.message} | state: ${JSON.stringify(state)}`);
  }
}
export async function open(page, baseUrl, query = '') {
  // play=1 skips the menu: a page reload banks gold and marks the save as played, which would land on the menu
  await page.goto(baseUrl + '/?debug=1&play=1' + query);
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
/** Converts game (screen-space) coordinates to page coordinates. */
export async function toPage(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  const size = await dbg(page, 'size');
  return { x: box.x + (x * box.width) / size.width, y: box.y + (y * box.height) / size.height };
}

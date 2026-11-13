export default async function (page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  if ((await page.locator('canvas').count()) < 1) throw new Error('no canvas');
  await page.screenshot({ path: 'e2e/out/smoke.png' });
}

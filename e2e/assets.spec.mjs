// Every manifest sheet must exist as a texture with the right frame count/size; with no art yet, all are placeholders.
export default async function (page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  const { textures, manifest } = await page.evaluate(() => ({ textures: window.__dbg.textures(), manifest: window.__dbg.manifest() }));
  const byKey = new Map(textures.map((t) => [t.key, t]));
  for (const m of manifest) {
    const t = byKey.get(m.key);
    if (!t) throw new Error(`missing texture ${m.key}`);
    if (t.frames !== m.frames || t.w !== m.frameWidth || t.h !== m.frameHeight) throw new Error(`bad texture ${m.key}: ${JSON.stringify(t)}`);
    if (!t.placeholder) throw new Error(`${m.key} should be a placeholder (no art yet)`);
  }
  if (manifest.length < 50) throw new Error('manifest too small: ' + manifest.length);
}

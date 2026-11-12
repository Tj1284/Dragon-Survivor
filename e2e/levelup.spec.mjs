import { dbg, open, sleep, waitFor } from './helpers.mjs';

const xpToNext = (l) => 5 + 4 * (l - 1);
function applyXp(level, xp, gained) {
  xp += gained; let n = 0;
  while (xp >= xpToNext(level)) { xp -= xpToNext(level); level++; n++; }
  return { level, xp, n };
}
const inLevelUp = (page) => dbg(page, 'scene').then((s) => s.includes('LevelUp'));

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');

  await dbg(page, 'addXp', 5);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  const cards = await dbg(page, 'cards');
  if (cards.length !== 3) throw new Error('expected 3 cards, got ' + cards.length);
  await page.screenshot({ path: 'e2e/out/levelup.png' });
  await page.keyboard.press('1');
  await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);
  const r1 = await dbg(page, 'run');
  if (r1.level !== 2) throw new Error('expected level 2, got ' + r1.level);

  // several levels at once (risk 2): one screen per level, in order
  const expected = applyXp(r1.level, r1.xp, 43);
  await dbg(page, 'addXp', 43);
  let screens = 0;
  for (let i = 0; i < 20; i++) {
    await sleep(150);
    if (!(await inLevelUp(page))) break;
    await dbg(page, 'pick', 0);
    screens++;
  }
  const r2 = await dbg(page, 'run');
  if (r2.pendingLevels !== 0 || r2.level !== expected.level) throw new Error(`after multi level-up: ${JSON.stringify(r2)} expected level ${expected.level}`);
  if (screens < expected.n) throw new Error(`expected ≥${expected.n} level-up screens, saw ${screens}`);
  if (await inLevelUp(page)) throw new Error('level-up screen still open');

  // the dragon kills an enemy, it drops a gem, picking it up gives xp
  const p = await dbg(page, 'player');
  await dbg(page, 'spawn', 'squire', 1, 40);
  await dbg(page, 'setEnemyHp', 1);
  await waitFor(page, () => window.__dbg.enemies() === 0, null, 2000);
  const gems = await dbg(page, 'pickups');
  if (gems.length < 1) throw new Error('no gem dropped');
  const xpBefore = (await dbg(page, 'run')).xp + (await dbg(page, 'run')).level * 1000;
  await dbg(page, 'teleport', gems[0].x, gems[0].y);
  await sleep(500);
  const r3 = await dbg(page, 'run');
  if (!(r3.xp + r3.level * 1000 > xpBefore)) throw new Error('xp did not increase after pickup');
  void p;
}

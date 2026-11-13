// Tail swipe, roar, meteor and static field, plus their gold versions.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

async function fresh(page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
}
async function dummies(page, n, dist) {
  await dbg(page, 'clearEnemies');
  await dbg(page, 'spawn', 'squire', n, dist);
  await dbg(page, 'setEnemyHp', 1e6);
  await dbg(page, 'freezeEnemies');
  await dbg(page, 'clearHitLog');
}
const hitsOf = async (page, source) => (await dbg(page, 'hitLog')).filter((h) => h.source === source);

export default async function (page, baseUrl) {
  // --- tail swipe: half circle towards where the dragon faces; gold = full circle ---
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'tail_swipe');
  await dbg(page, 'setFacing', 1);
  await dummies(page, 6, 25);
  await sleep(3000);
  let hits = await hitsOf(page, 'tail_swipe');
  if (hits.length === 0) throw new Error('tail swipe never hit');
  if (hits.some((h) => h.dx < -5)) throw new Error('tail swipe hit enemies behind the dragon: ' + JSON.stringify(hits.filter((h) => h.dx < -5)[0]));
  await dbg(page, 'giveGold', 'tail_swipe');
  await dummies(page, 6, 25);
  await sleep(3000);
  hits = await hitsOf(page, 'tail_swipe');
  if (!hits.some((h) => h.dx < -5) || !hits.some((h) => h.dx > 5)) throw new Error('gold tail swipe should hit all around');

  // --- roar: pushes away; gold also stuns ---
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'roar');
  await dummies(page, 6, 30);
  await waitFor(page, () => window.__dbg.hitLog().some((h) => h.source === 'roar'), null, 6000);
  await sleep(100);
  const dist = await dbg(page, 'enemyDistances');
  if (dist.some((d) => d < 50)) throw new Error('roar should push enemies beyond 50 px: ' + dist.map((d) => Math.round(d)).join(','));
  if ((await dbg(page, 'stunnedCount')) !== 0) throw new Error('plain roar must not stun');
  await dbg(page, 'giveGold', 'roar');
  await dummies(page, 6, 30);
  await waitFor(page, () => window.__dbg.stunnedCount() > 0, null, 7000);

  // --- meteor: explodes on an enemy; gold = three at once ---
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'meteor');
  await dummies(page, 8, 60);
  await waitFor(page, () => window.__dbg.hitLog().some((h) => h.source === 'meteor'), null, 6000);
  if ((await dbg(page, 'weaponStats')).meteorVolley !== 1) throw new Error('plain meteor should fall one at a time');
  await dbg(page, 'giveGold', 'meteor');
  await waitFor(page, () => window.__dbg.weaponStats().meteorVolley === 3, null, 6000);
  await page.screenshot({ path: 'e2e/out/meteor.png' });

  // --- static field: zaps a limited number of nearby enemies; gold charges with movement ---
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'static_field');
  await dummies(page, 6, 40);
  await waitFor(page, () => window.__dbg.hitLog().some((h) => h.source === 'static_field'), null, 4000);
  let stats = await dbg(page, 'weaponStats');
  if (!(stats.staticTargets >= 1 && stats.staticTargets <= 2)) throw new Error('level 1 static field should zap at most 2: ' + stats.staticTargets);
  if (stats.staticMult !== 1) throw new Error('plain static field must not charge: ' + stats.staticMult);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'giveGold', 'static_field');
  await page.keyboard.down('d'); await sleep(1500); await page.keyboard.up('d');
  stats = await dbg(page, 'weaponStats');
  if (!(stats.staticCharge > 1.5)) throw new Error('gold static field should charge while moving: ' + stats.staticCharge);
  // the charged discharge fires the instant enemies come into range, so watch the multiplier itself
  await dbg(page, 'spawn', 'squire', 6, 30);
  await waitFor(page, () => window.__dbg.weaponStats().staticMult > 1.5, null, 4000);
  await sleep(1500);
  stats = await dbg(page, 'weaponStats');
  if (!(stats.staticCharge < 1.2)) throw new Error('charge should reset after the discharge: ' + stats.staticCharge);
}

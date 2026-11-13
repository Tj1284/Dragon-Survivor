import { dbg, open, sleep, waitFor } from './helpers.mjs';

async function fresh(page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
}
const waitForm = (page, id) => waitFor(page, (f) => window.__dbg.player().formId === f, id, 4000)
  .catch(async () => { throw new Error(`expected form ${id}, got ${(await dbg(page, 'player')).formId}`); });

export default async function (page, baseUrl) {
  // fire picks → fire line; jumping 5 → 20 skips adult with a single animation
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'fire_orbit');
  await dbg(page, 'give', 'searing');
  await dbg(page, 'setLevel', 5);
  await waitForm(page, 'young_fire');
  if ((await dbg(page, 'run')).element !== 'fire') throw new Error('element should be fire');
  await sleep(1000);
  await dbg(page, 'setLevel', 20);
  await waitForm(page, 'legendary_fire');
  const evo = await dbg(page, 'evolutions');
  if (evo !== 2) throw new Error('expected 2 evolution animations, got ' + evo);
  await dbg(page, 'spawn', 'squire', 12, 60);
  await sleep(1500);
  await page.screenshot({ path: 'e2e/out/evo-legendary-fire.png' });

  // only neutral picks → the player chooses the element
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'fury');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
  const cards = await dbg(page, 'cards');
  if (cards.length !== 3) throw new Error('element picker should show 3 cards');
  await page.screenshot({ path: 'e2e/out/evo-element-picker.png' });
  await dbg(page, 'pick', 1);
  await waitForm(page, 'young_ice');

  // lightning majority
  await fresh(page, baseUrl);
  await dbg(page, 'give', 'thunder_strike');
  await dbg(page, 'give', 'thunder_strike');
  await dbg(page, 'give', 'frost_shards');
  await dbg(page, 'setLevel', 12);
  await waitForm(page, 'adult_lightning');
  await sleep(1000);
  // the bolt chains through several enemies
  await dbg(page, 'spawn', 'squire', 6, 50);
  await dbg(page, 'setEnemyHp', 999);
  await sleep(3000);
  const chain = await dbg(page, 'hitsBy', 'lightning');
  if (chain < 3) throw new Error('lightning should chain through ≥3 enemies, got ' + chain);
  await page.screenshot({ path: 'e2e/out/evo-adult-lightning.png' });

  // ice freezes
  await fresh(page, baseUrl);
  await dbg(page, 'chooseElementNext', 'ice');
  await dbg(page, 'give', 'fury');
  await dbg(page, 'setLevel', 12);
  await waitForm(page, 'adult_ice');
  await sleep(1000);
  await dbg(page, 'spawn', 'squire', 1, 30);
  await dbg(page, 'setEnemyHp', 999);
  await waitFor(page, () => window.__dbg.frozenCount() > 0, null, 4000)
    .catch(() => { throw new Error('ice never froze an enemy'); });

  // one screenshot per form for visual review
  for (const id of await dbg(page, 'allForms')) {
    await dbg(page, 'forceForm', id);
    await sleep(100);
    await page.screenshot({ path: `e2e/out/forms/${id}.png`, clip: { x: 380, y: 170, width: 200, height: 200 } });
  }
}

// The game runs on 4 attack slots, stats and guaranteed gold cards.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

async function levelUpOnce(page) {
  const r = await dbg(page, 'run');
  await dbg(page, 'addXp', 5 + 4 * (r.level - 1) - r.xp);
  await waitFor(page, () => window.__dbg.scene().includes('LevelUp'), null, 2000);
}
const find = (list, id) => list.find((a) => a.id === id);

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);

  let attacks = await dbg(page, 'attacks');
  if (JSON.stringify(attacks) !== JSON.stringify([{ id: 'spit', level: 1, gold: false }])) throw new Error('should start with the spit only: ' + JSON.stringify(attacks));

  // the spit becomes the breath and keeps its level (risk 2)
  await dbg(page, 'give', 'spit');
  await dbg(page, 'give', 'spit');
  await dbg(page, 'chooseElementNext', 'ice');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.player().formId === 'young_ice', null, 4000);
  await sleep(1000);
  attacks = await dbg(page, 'attacks');
  if (find(attacks, 'spit') || find(attacks, 'ice_breath')?.level !== 3) throw new Error('spit should have become ice_breath L3: ' + JSON.stringify(attacks));
  if (attacks.length !== 1) throw new Error('breath must reuse the spit slot: ' + JSON.stringify(attacks));

  // level 5 + key stat → the gold card is guaranteed and picking it evolves the attack
  for (let i = 0; i < 5; i++) await dbg(page, 'give', 'frost_shards');
  await dbg(page, 'give', 'fury');
  await levelUpOnce(page);
  let cards = await dbg(page, 'cards');
  if (!(cards[0].type === 'gold' && cards[0].id === 'frost_shards')) throw new Error('first card should be the gold frost_shards: ' + JSON.stringify(cards));
  await dbg(page, 'pick', 0);
  await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);
  attacks = await dbg(page, 'attacks');
  if (!find(attacks, 'frost_shards')?.gold) throw new Error('frost_shards should be gold: ' + JSON.stringify(attacks));

  // with 4 attacks held, no new attack is ever offered (risk 1)
  await dbg(page, 'give', 'frost_aura');
  await dbg(page, 'give', 'fire_orbit');
  attacks = await dbg(page, 'attacks');
  if (attacks.length !== 4) throw new Error('expected 4 attacks: ' + JSON.stringify(attacks));
  const held = new Set(attacks.map((a) => a.id));
  for (let i = 0; i < 6; i++) {
    await levelUpOnce(page);
    cards = await dbg(page, 'cards');
    for (const c of cards) if (c.kind === 'attack' && !held.has(c.id)) throw new Error('offered a 5th attack: ' + JSON.stringify(c));
    await dbg(page, 'pick', 0);
    await waitFor(page, () => !window.__dbg.scene().includes('LevelUp'), null, 2000);
  }
  // attacks keep hitting
  await dbg(page, 'spawn', 'squire', 8, 45);
  await dbg(page, 'setEnemyHp', 1e6);
  await sleep(2500);
  const hits = await dbg(page, 'hitsBySource');
  for (const src of ['ice_breath', 'frost_shards', 'frost_aura', 'fire_orbit']) if (!(hits[src] > 0)) throw new Error(`${src} never hit: ${JSON.stringify(hits)}`);
  await page.screenshot({ path: 'e2e/out/attacks.png' });
}

import { dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'chooseElementNext', 'ice');
  // the four attacks at max level and gold (risk 5)
  for (const id of ['spit', 'frost_shards', 'frost_aura', 'tail_swipe']) for (let i = 0; i < 5; i++) await dbg(page, 'give', id);
  await dbg(page, 'setLevel', 12);
  await waitFor(page, () => window.__dbg.player().formId === 'adult_ice', null, 4000);
  for (const id of ['ice_breath', 'frost_shards', 'frost_aura', 'tail_swipe']) await dbg(page, 'giveGold', id);
  const held = await dbg(page, 'attacks');
  if (held.length !== 4 || held.some((h) => !h.gold || h.level < 5)) throw new Error('perf setup: expected 4 gold attacks: ' + JSON.stringify(held));
  await dbg(page, 'spawn', 'squire', 300, 150);
  await dbg(page, 'setEnemyHp', 1e6);
  // warm the projectile pool, let it drain, then fill the screen with 200 long-lived projectiles
  await dbg(page, 'fireTest', 320, 1);
  await sleep(1500);
  await dbg(page, 'fireTest', 200, 8);
  await sleep(1000);
  const before = await dbg(page, 'poolStats');
  const samples = [];
  for (let i = 0; i < 5; i++) { await sleep(1000); samples.push(await dbg(page, 'fps')); }
  const after = await dbg(page, 'poolStats');
  const counts = await dbg(page, 'counts');
  const fps = samples.reduce((a, b) => a + b, 0) / samples.length;
  console.log(`perf: fps avg ${fps.toFixed(1)} min ${Math.min(...samples).toFixed(1)} | ${JSON.stringify(counts)} | timings ${JSON.stringify(await dbg(page, 'timings'))}`);
  if (counts.enemies < 300 || counts.projectiles < 200) throw new Error('load too small: ' + JSON.stringify(counts));
  if (fps < 30) throw new Error(`fps ${fps.toFixed(1)} < 30`);
  for (const k of Object.keys(after)) if (after[k] !== before[k]) throw new Error(`pool ${k} grew during the run: ${before[k]} → ${after[k]}`);
}

import { dbg, open, sleep } from './helpers.mjs';
export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true); await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  await dbg(page, 'give', 'regen');
  await sleep(500);
  const hp = (await dbg(page, 'player')).hp;
  if (hp < 1e8) throw new Error('debug health was capped by regen: ' + hp);
}

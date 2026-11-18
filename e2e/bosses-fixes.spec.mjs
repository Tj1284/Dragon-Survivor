// Review fixes: no zombie boss, bosses hit across their whole body, no patterns from off-screen.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);

  // a boss that comes due far away stays in chase: no wind-up or slam from off-screen
  await dbg(page, 'setElapsed', 179.5);
  await waitFor(page, () => window.__dbg.bosses().length === 1, null, 3000);
  for (let i = 0; i < 30; i++) {
    const b = (await dbg(page, 'bosses'))[0];
    const p = await dbg(page, 'player');
    // keep the dragon ~300 px away from the boss
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    await dbg(page, 'teleport', b.x + (dx / d) * 300, b.y + (dy / d) * 300);
    await sleep(100);
  }
  const used = await dbg(page, 'bossPatterns');
  if (used.length > 0) throw new Error('boss used a pattern while far away: ' + used.join(','));

  // projectiles hit anywhere on a big boss, not only near its centre
  // the captain's radius is 20 and the shot's 3, so anything up to 23 px from its centre must hit
  for (const offset of [10, 16, 20, 22]) {
    const before = (await dbg(page, 'bosses'))[0].hp;
    await dbg(page, 'shootBossAt', offset);
    await sleep(150);
    const after = (await dbg(page, 'bosses'))[0].hp;
    if (!(after < before)) throw new Error(`a shot ${offset} px from the boss centre did no damage`);
  }

  // a dead boss's slot reused by a normal enemy must not become a "zombie boss"
  await dbg(page, 'damageBoss', 1e9);
  await sleep(150);                      // the next frame returns the boss object to the pool
  await dbg(page, 'spawn', 'squire', 3, 120);
  await sleep(400);
  if ((await dbg(page, 'bosses')).length !== 0) throw new Error('a normal enemy is being driven as a boss');
  if ((await dbg(page, 'hud')).bossBar.visible) throw new Error('boss bar came back after the boss died');
}

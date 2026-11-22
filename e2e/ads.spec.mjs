// Rewarded revive (once per run), rewarded double gold (once), and no reward when the ad is not watched.
import { clickGame, dbg, open, sleep, waitFor } from './helpers.mjs';

async function tap(page, id) {
  const b = (await dbg(page, 'buttons')).find((x) => x.id === id);
  if (!b) throw new Error(`button ${id} not on screen: ${JSON.stringify(await dbg(page, 'buttons'))}`);
  await clickGame(page, b.x, b.y);
}
async function fall(page) {
  await dbg(page, 'setHp', 0.1);
  await dbg(page, 'spawn', 'heavy', 3, 5);
}

export default async function (page, baseUrl) {
  // without rewarded ads on the platform, falling goes straight to the game-over screen with no ad buttons
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  if (!(await page.evaluate(() => window.bridge?.advertisement?.isRewardedSupported))) {
    await fall(page);
    await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 4000);
    if ((await dbg(page, 'buttons')).some((b) => b.id === 'double')) throw new Error('no double-gold button without rewarded ads');
  }

  // revive watched to the end: back in the run at half health, once
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'adMock', 'rewarded');
  await fall(page);
  await waitFor(page, () => window.__dbg.scene().includes('Revive'), null, 4000);
  await tap(page, 'revive');
  await waitFor(page, () => window.__dbg.revives() === 1 && !window.__dbg.scene().includes('Revive'), null, 3000);
  const p = await dbg(page, 'player');
  if (!(p.hp >= p.maxHp * 0.45)) throw new Error('revive should give back half the health: ' + JSON.stringify(p));
  await page.screenshot({ path: 'e2e/out/revive.png' });
  await sleep(2300); // shield over
  await fall(page);
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 4000)
    .catch(async () => { throw new Error('a second fall must end the run (one revive per attempt): ' + await dbg(page, 'scene')); });

  // an ad that never answers must not trap the player: "No, thanks" always works
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'adMock', 'hang');
  await fall(page);
  await waitFor(page, () => window.__dbg.scene().includes('Revive'), null, 4000);
  await tap(page, 'revive');
  await sleep(300);
  await tap(page, 'no');
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000)
    .catch(async () => { throw new Error('declining must work while an ad is pending: ' + await dbg(page, 'scene')); });

  // ad closed early: no revive; the player can still decline and the run ends normally
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'adMock', 'closed');
  await dbg(page, 'setGold', 10);
  await fall(page);
  await waitFor(page, () => window.__dbg.scene().includes('Revive'), null, 4000);
  await tap(page, 'revive');
  await sleep(400);
  if (!(await dbg(page, 'scene')).includes('Revive') || (await dbg(page, 'revives')) !== 0) throw new Error('a closed ad must not revive');
  await tap(page, 'no');
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000);

  // double gold: closed ad gives nothing, a watched ad doubles once, a rebuilt screen doesn't add it again
  const g0 = (await dbg(page, 'save')).gold;
  await tap(page, 'double');
  await sleep(400);
  if ((await dbg(page, 'save')).gold !== g0) throw new Error('closed ad must not double the gold');
  await dbg(page, 'adMock', 'rewarded');
  await tap(page, 'double');
  await waitFor(page, (g) => window.__dbg.save().gold === g + 10, g0, 3000);
  await tap(page, 'double');
  await sleep(400);
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(500);
  await page.setViewportSize({ width: 960, height: 540 });
  await sleep(500);
  if ((await dbg(page, 'save')).gold !== g0 + 10) throw new Error('gold doubled more than once: ' + (await dbg(page, 'save')).gold);
  if ((await dbg(page, 'buttons')).some((b) => b.id === 'double')) throw new Error('the double-gold offer should be gone after use');
  await page.screenshot({ path: 'e2e/out/gameover-ads.png' });
  await dbg(page, 'adMock', null);

  // rotating while the double-gold ad plays: gold added once and the rebuilt screen shows the result
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'adMock', 'closed');
  await dbg(page, 'setGold', 5);
  await fall(page);
  await waitFor(page, () => window.__dbg.scene().includes('Revive'), null, 4000);
  await tap(page, 'no');
  await waitFor(page, () => window.__dbg.scene().includes('GameOver'), null, 3000);
  const g1 = (await dbg(page, 'save')).gold;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await dbg(page, 'adMock', 'slow');
  await tap(page, 'double');
  await sleep(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(1500);
  if ((await dbg(page, 'save')).gold !== g1 + 5) throw new Error('gold should be doubled once across a rotation: ' + (await dbg(page, 'save')).gold);
  if ((await dbg(page, 'buttons')).some((b) => b.id === 'double')) throw new Error('the rebuilt screen still offers gold x2');
  if (errors.length) throw new Error('errors after rotating during the ad: ' + errors.join('; '));
  await page.setViewportSize({ width: 960, height: 540 });
  await sleep(500);

  // the interstitial after a run plays out before the next run starts (it must never land on gameplay)
  await dbg(page, 'interstitialMock', 1200);
  const shown = await dbg(page, 'interstitials');
  await tap(page, 'again');
  await sleep(500);
  if (await dbg(page, 'interstitials') !== shown + 1) throw new Error('leaving the game-over screen should ask for an interstitial');
  if ((await dbg(page, 'scene')).includes('Game') && !(await dbg(page, 'scene')).includes('GameOver')) throw new Error('the new run started while the ad was still showing');
  await waitFor(page, () => window.__dbg.scene().includes('Game') && !window.__dbg.scene().includes('GameOver'), null, 3000);
  await dbg(page, 'interstitialMock', null);
}

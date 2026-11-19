// Sound: silent until the first gesture, no errors, kills make noise, mute is remembered.
import { dbg, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await page.goto(baseUrl + '/?debug=1');
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'setHp', 1e9);
  if ((await dbg(page, 'audio')).unlocked) throw new Error('audio must wait for a user gesture');

  await page.keyboard.press('d');
  await waitFor(page, () => window.__dbg.audio().unlocked, null, 2000);
  await waitFor(page, () => window.__dbg.audio().loaded >= 14, null, 5000)
    .catch(async () => { throw new Error('sound files should be decoded after the first gesture: ' + JSON.stringify(await dbg(page, 'audio'))); });
  await waitFor(page, () => /^level[123]$/.test(window.__dbg.audio().music ?? ''), null, 8000)
    .catch(async () => { throw new Error('a level track should play during a run: ' + (await dbg(page, 'audio')).music); });
  await dbg(page, 'spawn', 'squire', 3, 40);
  await waitFor(page, () => (window.__dbg.audio().played.kill ?? 0) > 0, null, 4000)
    .catch(async () => { throw new Error('killing should play a sound: ' + JSON.stringify(await dbg(page, 'audio'))); });

  // risk 2: a flood of hits doesn't flood the speakers
  await dbg(page, 'spawnDummies', 'squire', 60, 30);
  await dbg(page, 'give', 'frost_aura');
  await sleep(1000);
  const a = await dbg(page, 'audio');
  if (a.maxInWindow > 8) throw new Error('too many sounds at once: ' + a.maxInWindow);

  // hidden tab: sound stops (no new notes) and comes back when visible again (Playgama 3.3.5)
  const setHidden = (hidden) => page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { value: h, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: h ? 'hidden' : 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await setHidden(true);
  await sleep(300);
  const before = (await dbg(page, 'audio')).notes;
  await sleep(1500);
  const after = (await dbg(page, 'audio')).notes;
  if (after !== before) throw new Error(`sound kept playing in a hidden tab: ${after - before} new notes`);
  if ((await dbg(page, 'audio')).state === 'running') throw new Error('audio context should be suspended while hidden');
  await setHidden(false);
  await waitFor(page, () => window.__dbg.audio().state === 'running', null, 2000)
    .catch(() => { throw new Error('audio should resume when the tab is visible again'); });

  // mute from the pause menu is saved and survives a reload
  await page.keyboard.press('Escape');
  await waitFor(page, () => window.__dbg.scene().includes('Pause'), null, 2000);
  const mute = (await dbg(page, 'buttons')).find((b) => b.id === 'mute');
  if (!mute) throw new Error('pause menu should have a mute button');
  const box = await page.locator('canvas').boundingBox();
  const size = await dbg(page, 'size');
  await page.mouse.click(box.x + (mute.x * box.width) / size.width, box.y + (mute.y * box.height) / size.height);
  await waitFor(page, () => window.__dbg.audio().muted, null, 2000);
  if (!(await dbg(page, 'save')).muted) throw new Error('mute should be saved');
  await page.reload();
  await page.waitForFunction(() => window.__dbg?.ready === true, null, { timeout: 5000 });
  if (!(await dbg(page, 'audio')).muted) throw new Error('mute should survive a reload');
}

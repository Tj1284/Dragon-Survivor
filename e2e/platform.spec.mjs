// Playgama: the platform pauses and mutes the game (ads, tab switches) without breaking the player's own pause.
import { dbg, open, sleep, waitFor } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await page.keyboard.press('a'); // a gesture unlocks audio
  await waitFor(page, () => window.__dbg.audio().unlocked, null, 3000);

  // platform pause: the run clock stops and audio is suspended; resume continues both
  await dbg(page, 'platformPause', true);
  const t0 = (await dbg(page, 'run')).elapsed;
  await sleep(600);
  const t1 = (await dbg(page, 'run')).elapsed;
  if (t1 !== t0) throw new Error(`run clock kept going during a platform pause: ${t0} → ${t1}`);
  const a = await dbg(page, 'audio');
  if (a.state === 'running' || !a.platformPaused) throw new Error('audio should be suspended during a platform pause: ' + JSON.stringify(a));
  await dbg(page, 'platformPause', false);
  await sleep(400);
  if (!((await dbg(page, 'run')).elapsed > t1)) throw new Error('the run should continue after the platform resumes');
  await waitFor(page, () => window.__dbg.audio().state === 'running', null, 2000);

  // platform audio off: silent without changing the player's own sound setting
  await dbg(page, 'platformAudio', false);
  let st = await dbg(page, 'audio');
  if (!st.silent || st.muted) throw new Error('platform mute should silence without touching the player setting: ' + JSON.stringify(st));
  await dbg(page, 'platformAudio', true);
  st = await dbg(page, 'audio');
  if (st.silent) throw new Error('sound should come back when the platform allows it');

  // a run paused by the player stays paused when the platform resumes
  await page.keyboard.press('p');
  await waitFor(page, () => window.__dbg.scene().includes('Pause'), null, 2000);
  await dbg(page, 'platformPause', true);
  await dbg(page, 'platformPause', false);
  const p0 = (await dbg(page, 'run')).elapsed;
  await sleep(400);
  if ((await dbg(page, 'run')).elapsed !== p0 || !(await dbg(page, 'scene')).includes('Pause')) throw new Error('the pause menu must survive a platform pause/resume');
}

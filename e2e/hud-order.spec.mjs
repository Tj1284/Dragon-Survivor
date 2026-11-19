// Attack icons stay where they were: new attacks go to the end, the breath replaces the spit in place.
import { dbg, open, waitFor } from './helpers.mjs';
const ids = async (page) => (await dbg(page, 'hud')).attacks.map((a) => a.id);

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'give', 'roar');
  await dbg(page, 'give', 'tail_swipe');
  let order = await ids(page);
  if (order.join() !== 'spit,roar,tail_swipe') throw new Error('icons should follow the order picked: ' + order);
  await dbg(page, 'chooseElementNext', 'fire');
  await dbg(page, 'setLevel', 5);
  await waitFor(page, () => window.__dbg.player().formId === 'young_fire', null, 4000);
  order = await ids(page);
  if (order.join() !== 'fire_breath,roar,tail_swipe') throw new Error('the breath should take the spit slot: ' + order);
}

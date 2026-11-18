// Gems left on the ground are capped; extra xp merges into existing gems so none is lost.
import { dbg, open } from './helpers.mjs';

export default async function (page, baseUrl) {
  await open(page, baseUrl);
  await dbg(page, 'pauseSpawns', true);
  await dbg(page, 'clearEnemies');
  await dbg(page, 'dropGems', 400, 1);
  const gems = (await dbg(page, 'pickups')).filter((p) => p.kind === 'xp');
  if (gems.length > 250) throw new Error('too many gems on the ground: ' + gems.length);
  const total = await dbg(page, 'gemXpTotal');
  if (total !== 400) throw new Error('xp lost or duplicated while merging: ' + total);
}

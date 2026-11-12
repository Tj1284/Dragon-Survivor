import { expect, it } from 'vitest';
import { createRng } from '../../src/logic/rng';
import { UPGRADES, availableUpgrades, rollChoices, type OfferContext } from '../../src/logic/upgrades';

const none: OfferContext = { owned: {}, element: null };

it('offers neutral upgrades and the three element weapons at the start', () => {
  expect(availableUpgrades(none)).toEqual(expect.arrayContaining(['swift_wings', 'fire_orbit', 'frost_shards', 'thunder_strike']));
});
it('offers element passives only with that element weapon or element', () => {
  expect(availableUpgrades(none)).not.toContain('searing');
  expect(availableUpgrades({ owned: { fire_orbit: 1 }, element: null })).toContain('searing');
  expect(availableUpgrades({ owned: {}, element: 'ice' })).toContain('shatter');
});
it('excludes other elements once the element is fixed', () => {
  const iceCtx: OfferContext = { owned: { fire_orbit: 2 }, element: 'ice' };
  expect(availableUpgrades(iceCtx)).not.toContain('fire_orbit');
  expect(availableUpgrades(iceCtx)).not.toContain('searing');
});
it('excludes maxed upgrades', () => {
  expect(availableUpgrades({ owned: { magnet: 3 }, element: null })).not.toContain('magnet');
});
it('rolls 3 distinct choices', () => {
  const c = rollChoices(none, createRng(1));
  expect(c).toHaveLength(3);
  expect(new Set(c.map((x) => JSON.stringify(x))).size).toBe(3);
});
it('falls back when everything is maxed', () => {
  const maxed = Object.fromEntries(UPGRADES.map((u) => [u.id, u.maxLevel]));
  expect(rollChoices({ owned: maxed, element: 'fire' }, createRng(1))).toEqual([{ type: 'fallback' }]);
});
it('defines 21 upgrades with the planned max levels', () => {
  expect(UPGRADES).toHaveLength(21);
  const max5 = ['swift_wings', 'thick_scales', 'fury', 'quick_breath', 'fire_orbit', 'frost_shards', 'thunder_strike', 'searing', 'ice_armor', 'extra_jump', 'spark_speed'];
  for (const u of UPGRADES) expect(u.maxLevel).toBe(max5.includes(u.id) ? 5 : 3);
});

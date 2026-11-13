import { expect, it } from 'vitest';
import {
  ATTACKS, ATTACK_IDS, BASE_STATS, STAT_IDS, attackParams, availableUpgrades, computeStats, eligibleGold,
  heldAttacks, rollChoices, spitToBreath, tagOf, type Loadout, type Owned,
} from '../../src/logic/attacks';
import { createRng } from '../../src/logic/rng';

const base: Loadout = { owned: { spit: 1 }, element: null, gold: [] };

it('offers stats, the starting attack and element attacks, but never the breaths', () => {
  const a = availableUpgrades(base);
  expect(a).toEqual(expect.arrayContaining(['spit', 'fury', 'armor', 'fire_orbit', 'frost_shards', 'frost_aura', 'thunder_strike']));
  for (const breath of ['fire_breath', 'ice_breath', 'lightning_breath']) expect(a).not.toContain(breath);
});
it('with 4 attacks held offers no new attack, but held ones of any element can still level', () => {
  const full: Loadout = { owned: { ice_breath: 2, frost_aura: 1, thunder_strike: 1, fire_orbit: 3 }, element: 'ice', gold: [] };
  const f = availableUpgrades(full);
  expect(f).not.toContain('frost_shards');
  expect(f).toEqual(expect.arrayContaining(['ice_breath', 'frost_aura', 'thunder_strike', 'fire_orbit', 'fury']));
});
it('once the element is fixed, new attacks of other elements are not offered', () => {
  const ice: Loadout = { owned: { ice_breath: 1 }, element: 'ice', gold: [] };
  expect(availableUpgrades(ice)).toContain('frost_aura');
  expect(availableUpgrades(ice)).not.toContain('fire_orbit');
  expect(availableUpgrades(ice)).not.toContain('thunder_strike');
});
it('excludes maxed attacks and stats', () => {
  const a = availableUpgrades({ owned: { spit: 5, fury: 5 }, element: null, gold: [] });
  expect(a).not.toContain('spit');
  expect(a).not.toContain('fury');
});
it('a gold evolution needs level 5 plus the key stat, once', () => {
  expect(eligibleGold({ owned: { frost_aura: 5 }, element: null, gold: [] })).toEqual([]);
  expect(eligibleGold({ owned: { frost_aura: 4, regen: 1 }, element: null, gold: [] })).toEqual([]);
  expect(eligibleGold({ owned: { frost_aura: 5, regen: 1 }, element: null, gold: [] })).toEqual(['frost_aura']);
  expect(eligibleGold({ owned: { frost_aura: 5, regen: 1 }, element: null, gold: ['frost_aura'] })).toEqual([]);
  expect(eligibleGold({ owned: { spit: 5, fury: 3 }, element: null, gold: [] })).toEqual([]);
});
it('the gold card is guaranteed, one per level-up, in a stable order', () => {
  const two: Loadout = { owned: { fire_orbit: 5, swift_wings: 1, frost_aura: 5, regen: 2 }, element: null, gold: [] };
  const c = rollChoices(two, createRng(3));
  expect(c[0]).toEqual({ type: 'gold', id: 'fire_orbit' });
  expect(c.filter((x) => x.type === 'gold')).toHaveLength(1);
  expect(c).toHaveLength(3);
  expect(new Set(c.map((x) => JSON.stringify(x))).size).toBe(3);
});
it('falls back when nothing is left to offer', () => {
  const held = ['fire_breath', 'fire_orbit', 'frost_aura', 'thunder_strike'] as const;
  const maxed: Owned = Object.fromEntries([...STAT_IDS, ...held].map((id) => [id, 5]));
  expect(rollChoices({ owned: maxed, element: 'fire', gold: [...held] }, createRng(1))).toEqual([{ type: 'fallback' }]);
});
it('the spit becomes the breath of the element and keeps its level', () => {
  expect(spitToBreath({ spit: 3, fury: 1 }, 'ice')).toEqual({ ice_breath: 3, fury: 1 });
  expect(heldAttacks({ fury: 2, frost_aura: 1, spit: 1 })).toEqual(['spit', 'frost_aura']);
  expect(tagOf('fury')).toBe('neutral');
  expect(tagOf('frost_aura')).toBe('ice');
});
it('attack numbers follow the plan tables', () => {
  expect(attackParams('spit', 1, false)).toMatchObject({ damage: 12, cooldown: 0.7, count: 1 });
  expect(attackParams('spit', 5, false)).toMatchObject({ damage: 19, cooldown: 0.55, count: 3 });
  expect(attackParams('fire_orbit', 5, true)).toMatchObject({ count: 8, radius: 48, damage: 15 });
  expect(attackParams('lightning_breath', 5, true).extra).toBe(12);
  expect(attackParams('thunder_strike', 5, true).count).toBe(5);
});
it('every level changes something and every gold version differs from level 5', () => {
  for (const id of ATTACK_IDS) {
    for (let l = 2; l <= 5; l++) expect(attackParams(id, l, false), `${id} L${l}`).not.toEqual(attackParams(id, l - 1, false));
    if (ATTACKS[id].key) expect(attackParams(id, 5, true), id).not.toEqual(attackParams(id, 5, false));
  }
});
it('stats stack with the stage bonus', () => {
  expect(computeStats(0, {})).toEqual(BASE_STATS);
  const s = computeStats(2, { thick_scales: 2, fury: 3, quick_breath: 1, armor: 2, magnet: 5, swift_wings: 2, regen: 2 });
  expect(s.maxHp).toBe(190);
  expect(s.damageMult).toBeCloseTo(2.21);
  expect(s.cooldownMult).toBeCloseTo(0.92);
  expect(s.armor).toBe(2);
  expect(s.pickupRadius).toBeCloseTo((40 + 16) * 2);
  expect(s.speed).toBeCloseTo(70 * 1.16);
  expect(s.regen).toBe(1);
});
it('the four new attacks are offered as cards', () => {
  expect(availableUpgrades(base)).toEqual(expect.arrayContaining(['tail_swipe', 'roar', 'meteor', 'static_field']));
});

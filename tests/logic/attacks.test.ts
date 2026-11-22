import { fallbackHeal } from '../../src/logic/attacks';
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
    for (let l = 2; l <= 5; l++) {
      // more damage alone doesn't count: every level must also change shots, area, reach or cooldown
      const { damage: _a, ...now } = attackParams(id, l, false);
      const { damage: _b, ...before } = attackParams(id, l - 1, false);
      expect(now, `${id} L${l}`).not.toEqual(before);
    }
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

import { nextOrder } from '../../src/logic/attacks';
it('HUD order follows acquisition; the breath takes the spit slot', () => {
  expect(nextOrder(['spit'], { spit: 1, tail_swipe: 1 })).toEqual(['spit', 'tail_swipe']);
  expect(nextOrder(['spit', 'tail_swipe', 'roar'], { fire_breath: 2, tail_swipe: 1, roar: 1 })).toEqual(['fire_breath', 'tail_swipe', 'roar']);
  expect(nextOrder(['fire_breath', 'tail_swipe'], { fire_breath: 2, tail_swipe: 1, frost_aura: 1 })).toEqual(['fire_breath', 'tail_swipe', 'frost_aura']);
});

it('poison attacks: numbers, gold versions and offers', () => {
  expect(attackParams('toxic_cloud', 5, true).radius).toBe(54);
  expect(attackParams('toxic_cloud', 5, true).count).toBe(2);
  expect(attackParams('poison_breath', 1, false).extra).toBe(4);
  expect(attackParams('poison_breath', 1, true).extra).toBe(6);
  expect(spitToBreath({ spit: 3 }, 'poison')).toEqual({ poison_breath: 3 });
  const offers = availableUpgrades({ owned: { poison_breath: 1 }, element: 'poison', gold: [] });
  expect(offers).toContain('toxic_cloud');
  expect(offers).toContain('venom_spines');
  expect(offers).not.toContain('meteor');
  expect(offers).not.toContain('reaper');
});

it('shadow attacks: numbers and gold versions', () => {
  expect(attackParams('reaper', 5, true).extra).toBe(0.3);
  expect(attackParams('void_rift', 1, true).radius).toBe(52);
  expect(attackParams('void_rift', 1, true).count).toBe(2);
  expect(spitToBreath({ spit: 2 }, 'shadow')).toEqual({ shadow_breath: 2 });
  expect(ATTACKS.shadow_breath.offered).toBe(false);
});

it('the fallback heal never brings a fallen dragon back (only the revive ad can)', () => {
  expect(fallbackHeal(0, 100)).toBe(0);
  expect(fallbackHeal(-3, 100)).toBe(-3);
  expect(fallbackHeal(50, 100)).toBe(80);
  expect(fallbackHeal(90, 100)).toBe(100);
});

import { expect, it } from 'vitest';
import { BASE_STATS, computeStats } from '../../src/logic/stats';

it('a fresh hatchling has the base stats', () => {
  expect(computeStats(0, {})).toEqual(BASE_STATS);
});
it('stage bonus and upgrades stack', () => {
  const s = computeStats(2, { thick_scales: 2, fury: 3, quick_breath: 1 });
  expect(s.maxHp).toBe(190);
  expect(s.damageMult).toBeCloseTo(2.21);
  expect(s.cooldownMult).toBeCloseTo(0.92);
});
it('speed, pickup, regen and armor follow their upgrades', () => {
  const s = computeStats(1, { swift_wings: 2, magnet: 1, regen: 2, ice_armor: 3 });
  expect(s.speed).toBeCloseTo(70 * 1.16);
  expect(s.pickupRadius).toBeCloseTo((40 + 8) * 1.2);
  expect(s.regen).toBe(1);
  expect(s.armor).toBe(3);
});
it('a fresh hatchling picks gems up from 40 px away', () => {
  expect(BASE_STATS.pickupRadius).toBe(40);
});

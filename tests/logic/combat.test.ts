import { expect, it } from 'vitest';
import { armorReduce, chainTargets, damageMultiplier, newIceStatus, registerIceHit } from '../../src/logic/combat';

const pts = [{ id: 1, x: 10, y: 0 }, { id: 2, x: 30, y: 0 }, { id: 3, x: 200, y: 0 }, { id: 4, x: 50, y: 0 }];

it('chains greedily to the nearest unhit target within range', () => {
  expect(chainTargets({ x: 0, y: 0 }, pts, 3, 60)).toEqual([1, 2, 4]);
  expect(chainTargets({ x: 0, y: 0 }, pts, 10, 60)).toEqual([1, 2, 4]);
  expect(chainTargets({ x: 0, y: 0 }, [], 3, 60)).toEqual([]);
});
it('armor reduces damage but never below 1', () => {
  expect(armorReduce(5, 10)).toBe(1);
  expect(armorReduce(12, 2)).toBe(10);
});
it('three ice hits within 2s freeze for 1.5s and frozen enemies take extra damage', () => {
  let s = newIceStatus();
  s = registerIceHit(s, 0); s = registerIceHit(s, 1);
  expect(damageMultiplier(s, 1, 0)).toBe(1);
  expect(s.slowUntil).toBe(3);
  s = registerIceHit(s, 1.5);
  expect(s.frozenUntil).toBe(3);
  expect(damageMultiplier(s, 2, 2)).toBe(2);
});
it('hits outside the 2s window do not freeze', () => {
  let t = newIceStatus();
  t = registerIceHit(t, 0); t = registerIceHit(t, 1); t = registerIceHit(t, 3);
  expect(t.frozenUntil).toBe(0);
});

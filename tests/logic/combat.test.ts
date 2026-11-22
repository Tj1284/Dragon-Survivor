import { describe, expect, it } from 'vitest';
import { applyPoison, armorReduce, chainTargets, damageMultiplier, newIceStatus, newPoison, registerIceHit, tickPoison } from '../../src/logic/combat';

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

it('a third ice hit never shortens a longer existing freeze', () => {
  let s = { ...newIceStatus(), frozenUntil: 10 };
  s = registerIceHit(s, 5); s = registerIceHit(s, 5.1); s = registerIceHit(s, 5.2);
  expect(s.frozenUntil).toBe(10);
});

describe('poison', () => {
  it('releases damage in 0.5 s ticks: 4 dps over 1 s is two ticks of 2', () => {
    let s = applyPoison(newPoison(), 4, 3, 0);
    const ticks: number[] = [];
    for (let t = 0.1; t <= 1.0001; t += 0.1) {
      const r = tickPoison(s, 0.1, t);
      s = r.s;
      if (r.damage > 0) ticks.push(r.damage);
    }
    expect(ticks.length).toBe(2);
    expect(ticks[0]).toBeCloseTo(2);
    expect(ticks[1]).toBeCloseTo(2);
  });
  it('stops when the poison runs out', () => {
    let s = applyPoison(newPoison(), 10, 1, 0);
    let total = 0;
    for (let t = 0.1; t <= 3; t += 0.1) { const r = tickPoison(s, 0.1, t); s = r.s; total += r.damage; }
    expect(total).toBeCloseTo(10, 0);
  });
  it('keeps the stronger dps and extends the duration', () => {
    const a = applyPoison(newPoison(), 8, 3, 0);
    const b = applyPoison(a, 2, 3, 2);
    expect(b.dps).toBe(8);
    expect(b.until).toBe(5);
    expect(applyPoison(b, 12, 1, 2).dps).toBe(12);
    expect(applyPoison(b, 12, 1, 2).until).toBe(5);
  });
});

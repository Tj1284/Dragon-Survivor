import { expect, it } from 'vitest';
import { createRng } from '../../src/logic/rng';
import { ENEMIES } from '../../src/config/balance';
import { hpMult, pickEnemyType, spawnPosition, spawnRate, stepSpawnBudget, targetAlive } from '../../src/logic/spawn';

it('starts with few enemies and grows along a curve up to 300', () => {
  expect(targetAlive(0)).toBe(4);
  expect(targetAlive(60)).toBe(13);
  expect(targetAlive(120)).toBe(28);
  expect(targetAlive(300)).toBe(103);
  expect(targetAlive(600)).toBe(300);
});
it('enemies trickle in: 1 per second at the start, faster later, capped at 12/s', () => {
  expect(spawnRate(0)).toBe(1);
  expect(spawnRate(120)).toBe(4);
  expect(spawnRate(1000)).toBe(12);
});
it('the spawn budget never releases a burst', () => {
  // a full second at the start with 4 missing enemies: only one comes in
  let b = { budget: 0, count: 0 };
  let spawned = 0;
  for (let i = 0; i < 60; i++) { b = stepSpawnBudget(b.budget, 1 / 60, 0, 4 - spawned); spawned += b.count; }
  expect(spawned).toBe(1);
  // nothing missing: the budget doesn't hoard spawns for later
  expect(stepSpawnBudget(0, 10, 0, 0).budget).toBeLessThanOrEqual(1);
});
it('a squire dies to one hatchling spit during the first half minute', () => {
  expect(ENEMIES.squire.hp * hpMult(30)).toBeLessThanOrEqual(12);
});
it('enemy hp scales with time', () => {
  expect(hpMult(180)).toBe(2);
});
it('only squires at the start, all six types by minute five', () => {
  const r = createRng(7);
  for (let i = 0; i < 200; i++) expect(pickEnemyType(0, r)).toBe('squire');
  const seen = new Set<string>();
  const r2 = createRng(7);
  for (let i = 0; i < 2000; i++) seen.add(pickEnemyType(300, r2));
  expect(seen.size).toBe(6);
});
it('spawns on a ring just outside the view', () => {
  const p = spawnPosition(100, 50, 480, 270, createRng(3));
  expect(Math.hypot(p.x - 100, p.y - 50)).toBeCloseTo(Math.hypot(480, 270) / 2 + 20, 3);
});

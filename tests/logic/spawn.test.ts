import { expect, it } from 'vitest';
import { createRng } from '../../src/logic/rng';
import { hpMult, pickEnemyType, spawnPosition, targetAlive } from '../../src/logic/spawn';

it('target alive count grows with time and caps at 300', () => {
  expect(targetAlive(0)).toBe(15);
  expect(targetAlive(100)).toBe(65);
  expect(targetAlive(600)).toBe(300);
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

import { expect, it } from 'vitest';
import { enemyTint, nearestTarget, shadowOffset } from '../../src/logic/visuals';

it('a lancer winding up shows its red warning even when poisoned', () => {
  expect(enemyTint({ flashing: false, frozen: false, stunned: false, poisoned: true, windup: true })?.color).toBe(0xff8080);
  expect(enemyTint({ flashing: false, frozen: false, stunned: false, poisoned: true, windup: false })?.color).toBe(0xb8ff9a);
  expect(enemyTint({ flashing: true, frozen: true, stunned: false, poisoned: true, windup: true })?.mode).toBe('fill');
  expect(enemyTint({ flashing: false, frozen: false, stunned: false, poisoned: false, windup: false })).toBeNull();
});

it('homing picks the nearest enemy it has not already hit', () => {
  const es = [{ id: 1, x: 5, y: 0, alive: true }, { id: 2, x: 50, y: 0, alive: true }, { id: 3, x: 1, y: 0, alive: false }];
  expect(nearestTarget(es, 0, 0, 220, [])?.id).toBe(1);
  expect(nearestTarget(es, 0, 0, 220, [1])?.id).toBe(2);
  expect(nearestTarget(es, 0, 0, 220, [1, 2])).toBeNull();
});

it('the ground shadow sits under the feet of every stage', () => {
  // legendary art (96 px frame) only reaches ~18 px below the centre
  expect(shadowOffset('legendary_fire', 96)).toBeLessThanOrEqual(22);
  expect(shadowOffset('legendary_fire', 96)).toBeGreaterThanOrEqual(14);
  expect(shadowOffset('adult_ice', 48)).toBeCloseTo(48 / 2 * 0.85);
  expect(shadowOffset('hatchling', 32)).toBeCloseTo(32 / 2 * 0.85);
});

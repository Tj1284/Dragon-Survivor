import { expect, it } from 'vitest';
import { clampDelta } from '../../src/logic/time';

it('clamps long frame deltas (tab switch) to 50ms', () => {
  expect(clampDelta(16)).toBe(16);
  expect(clampDelta(5000)).toBe(50);
});

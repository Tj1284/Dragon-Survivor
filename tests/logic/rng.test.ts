import { expect, it } from 'vitest';
import { createRng } from '../../src/logic/rng';

it('same seed gives the same sequence of values in [0,1)', () => {
  const a = createRng(42), b = createRng(42), c = createRng(43);
  const sa = Array.from({ length: 50 }, a), sb = Array.from({ length: 50 }, b), sc = Array.from({ length: 50 }, c);
  expect(sa).toEqual(sb);
  expect(sa).not.toEqual(sc);
  for (const v of sa) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
});

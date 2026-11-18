import { expect, it } from 'vitest';
import { createLimiter } from '../../src/audio/limiter';

it('the same sound plays at most once every 50 ms', () => {
  const l = createLimiter({ perSound: 0.05, window: 0.1, maxInWindow: 8 });
  expect(l.allow('hit', 0)).toBe(true);
  expect(l.allow('hit', 0.03)).toBe(false);
  expect(l.allow('hit', 0.06)).toBe(true);
});
it('no more than 8 sounds in any 100 ms window', () => {
  const l = createLimiter({ perSound: 0.05, window: 0.1, maxInWindow: 8 });
  let n = 0;
  for (let i = 0; i < 20; i++) if (l.allow(`s${i}`, i * 0.0025)) n++;
  expect(n).toBe(8);
  expect(l.allow('late', 0.2)).toBe(true);
});
it('a muted limiter lets nothing through', () => {
  const l = createLimiter({ perSound: 0.05, window: 0.1, maxInWindow: 8 });
  l.muted = true;
  expect(l.allow('hit', 0)).toBe(false);
});

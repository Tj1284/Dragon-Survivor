import { expect, it } from 'vitest';
import { cardLayout } from '../../src/logic/cardLayout';

function check(w: number, h: number, n: number) {
  const l = cardLayout(w, h, n);
  expect(l.cards).toHaveLength(n);
  for (const c of l.cards) {
    expect(c.x - c.w / 2).toBeGreaterThanOrEqual(0);
    expect(c.x + c.w / 2).toBeLessThanOrEqual(w);
    expect(c.y - c.h / 2).toBeGreaterThanOrEqual(30); // below the title
    expect(c.y + c.h / 2).toBeLessThanOrEqual(h);
    expect(c.w).toBeGreaterThanOrEqual(70);
    expect(c.h).toBeGreaterThanOrEqual(44);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = l.cards[i], b = l.cards[j];
    const overlap = Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;
    expect(overlap).toBe(false);
  }
  return l;
}

it('lays out choice cards for every screen shape, square included (Playgama 1.6.4, 1.6.8)', () => {
  expect(check(584, 270, 5).mode).toBe('row');
  expect(check(584, 270, 3).mode).toBe('row');
  expect(check(270, 584, 5).mode).toBe('list');
  expect(check(270, 270, 3).mode).toBe('list');
  expect(check(270, 270, 5).mode).toBe('grid');
  check(360, 270, 5);
  check(270, 360, 5);
  check(600, 270, 1);
});

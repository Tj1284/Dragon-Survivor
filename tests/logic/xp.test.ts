import { expect, it } from 'vitest';
import { applyXp, xpToNext } from '../../src/logic/xp';

it('xp needed grows by 4 per level starting at 5', () => {
  expect(xpToNext(1)).toBe(5);
  expect(xpToNext(5)).toBe(21);
});
it('applyXp handles exact, multiple and zero level-ups', () => {
  expect(applyXp({ level: 1, xp: 0 }, 5)).toEqual({ level: 2, xp: 0, levelsGained: 1 });
  expect(applyXp({ level: 1, xp: 3 }, 40)).toEqual({ level: 4, xp: 16, levelsGained: 3 });
  expect(applyXp({ level: 3, xp: 0 }, 0)).toEqual({ level: 3, xp: 0, levelsGained: 0 });
});

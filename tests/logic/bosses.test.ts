import { expect, it } from 'vitest';
import { BOSSES, bossesDue } from '../../src/logic/bosses';

it('bosses arrive at 3:00, 6:00 and 10:00, once each', () => {
  expect(bossesDue(179, new Set())).toEqual([]);
  expect(bossesDue(180, new Set()).map((b) => b.id)).toEqual(['captain']);
  expect(bossesDue(700, new Set(['captain'])).map((b) => b.id)).toEqual(['champion', 'grand_hunter']);
  expect(bossesDue(700, new Set(BOSSES.map((b) => b.id)))).toEqual([]);
  expect(BOSSES.filter((b) => b.final).map((b) => b.id)).toEqual(['grand_hunter']);
});

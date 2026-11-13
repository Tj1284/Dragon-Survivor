import { expect, it } from 'vitest';
import { SpatialGrid } from '../../src/logic/spatialGrid';

it('returns ids within the exact radius, including negative coordinates', () => {
  const g = new SpatialGrid(32);
  g.insert(1, 0, 0); g.insert(2, 10, 0); g.insert(3, 100, 0); g.insert(4, -20, -5);
  expect(g.queryRadius(0, 0, 25, []).sort()).toEqual([1, 2, 4]);
});
it('empties the out array before filling it', () => {
  const g = new SpatialGrid(32);
  g.insert(3, 100, 0);
  const out = [99];
  g.queryRadius(100, 0, 1, out);
  expect(out).toEqual([3]);
});
it('clear removes everything', () => {
  const g = new SpatialGrid(32);
  g.insert(1, 0, 0); g.clear();
  expect(g.queryRadius(0, 0, 100, [])).toEqual([]);
});

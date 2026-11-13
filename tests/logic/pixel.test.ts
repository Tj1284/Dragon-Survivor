import { expect, it } from 'vitest';
import { PixelCanvas, rgb } from '../../src/art/pixel';

it('outline surrounds opaque pixels with the outline colour', () => {
  const pc = new PixelCanvas(5, 5);
  pc.set(2, 2, rgb(255, 0, 0));
  pc.outline(rgb(0, 0, 0));
  expect(pc.get(2, 2)).toBe(rgb(255, 0, 0));
  for (const [x, y] of [[1, 2], [3, 2], [2, 1], [2, 3]]) expect(pc.get(x, y)).toBe(rgb(0, 0, 0));
  expect(pc.get(1, 1)).toBe(0);
});
it('ignores writes outside the canvas', () => {
  const pc = new PixelCanvas(4, 4);
  pc.set(-1, 0, rgb(1, 2, 3)); pc.set(4, 4, rgb(1, 2, 3));
  expect(pc.opaqueCount()).toBe(0);
});
it('fills an ellipse symmetrically', () => {
  const pc = new PixelCanvas(11, 11);
  pc.ellipse(5.5, 5.5, 3, 2, rgb(9, 9, 9)); // pixel centres sit at +0.5
  expect(pc.get(5, 5)).toBe(rgb(9, 9, 9));
  expect(pc.get(2, 5)).toBe(pc.get(8, 5));
  expect(pc.get(5, 0)).toBe(0);
});

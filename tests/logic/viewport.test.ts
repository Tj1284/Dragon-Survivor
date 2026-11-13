import { describe, expect, it } from 'vitest';
import { computeGameSize } from '../../src/logic/viewport';

describe('computeGameSize', () => {
  it('keeps the short side at 270 in landscape and portrait', () => {
    expect(computeGameSize(1920, 1080)).toEqual({ width: 480, height: 270 });
    expect(computeGameSize(1080, 1920)).toEqual({ width: 270, height: 480 });
  });
  it('scales the long side with the aspect ratio, clamped to 600', () => {
    expect(computeGameSize(2400, 1080)).toEqual({ width: 600, height: 270 });
    expect(computeGameSize(3000, 1000)).toEqual({ width: 600, height: 270 });
    expect(computeGameSize(390, 844)).toEqual({ width: 270, height: 584 });
  });
  it('handles a square viewport', () => {
    expect(computeGameSize(1000, 1000)).toEqual({ width: 270, height: 270 });
  });
});

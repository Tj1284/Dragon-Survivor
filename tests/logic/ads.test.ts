import { expect, it } from 'vitest';
import { rewardedResult } from '../../src/logic/ads';

it('a rewarded ad pays out only when it reached the rewarded state', () => {
  expect(rewardedResult(['loading', 'opened', 'rewarded', 'closed'])).toBe('rewarded');
  expect(rewardedResult(['opened', 'closed'])).toBe('declined');
  expect(rewardedResult(['loading', 'failed'])).toBe('declined');
  expect(rewardedResult(['loading', 'opened'])).toBe('pending');
  expect(rewardedResult(['opened', 'rewarded'])).toBe('pending');
  expect(rewardedResult([])).toBe('pending');
});

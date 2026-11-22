import { expect, it } from 'vitest';
import { audioShouldRun, isSilent } from '../../src/audio/state';

it('sound is silent when the player muted it or the platform did', () => {
  expect(isSilent({ user: false, platform: false })).toBe(false);
  expect(isSilent({ user: true, platform: false })).toBe(true);
  expect(isSilent({ user: false, platform: true })).toBe(true);
  expect(isSilent({ user: true, platform: true })).toBe(true);
});

it('audio only runs while the tab is visible and the platform has not paused the game', () => {
  expect(audioShouldRun({ hidden: false, platformPaused: false })).toBe(true);
  expect(audioShouldRun({ hidden: true, platformPaused: false })).toBe(false);
  expect(audioShouldRun({ hidden: false, platformPaused: true })).toBe(false);
});

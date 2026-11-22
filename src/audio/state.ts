/** Effective mute: the player's own setting or the platform (an ad, the platform's sound toggle). */
export function isSilent(s: { user: boolean; platform: boolean }): boolean {
  return s.user || s.platform;
}

/** The audio context only runs while the tab is visible and the platform hasn't paused the game. */
export function audioShouldRun(s: { hidden: boolean; platformPaused: boolean }): boolean {
  return !s.hidden && !s.platformPaused;
}

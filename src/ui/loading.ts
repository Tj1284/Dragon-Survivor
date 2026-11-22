import { platform } from '../platform/bridge';

/**
 * Removes the HTML loading screen once the first scene is on screen, and tells the platform the game is
 * playable (`game_ready`: the platform hides its own loading screen and starts analytics).
 */
export function hideLoading(): void {
  document.getElementById('loading')?.remove();
  platform.gameReady();
}

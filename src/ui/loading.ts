/** Removes the HTML loading screen once the first scene is on screen. */
export function hideLoading(): void {
  document.getElementById('loading')?.remove();
}

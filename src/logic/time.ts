export const MAX_DELTA_MS = 50;

export function clampDelta(ms: number): number {
  return Math.min(ms, MAX_DELTA_MS);
}

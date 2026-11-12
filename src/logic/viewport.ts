export const SHORT_SIDE = 270;
export const MAX_LONG_SIDE = 600;

/** Logical game size: short side fixed at 270, long side follows the viewport aspect (clamped to 270..600). */
export function computeGameSize(viewW: number, viewH: number): { width: number; height: number } {
  const landscape = viewW >= viewH;
  const long = Math.max(viewW, viewH);
  const short = Math.max(1, Math.min(viewW, viewH));
  const longSide = Math.min(MAX_LONG_SIDE, Math.max(SHORT_SIDE, Math.round((SHORT_SIDE * long) / short)));
  return landscape ? { width: longSide, height: SHORT_SIDE } : { width: SHORT_SIDE, height: longSide };
}

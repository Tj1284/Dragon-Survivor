import type { FormId } from '../logic/types';

/** Collision radius by growth stage, independent of how big the sprite frame is drawn. */
const STAGE_RADIUS = { hatchling: 8.4, young: 11.2, adult: 16.8, legendary: 22.4 } as const;

export function hitRadius(id: FormId): number {
  return STAGE_RADIUS[id.split('_')[0] as keyof typeof STAGE_RADIUS];
}

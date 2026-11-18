import { DRAGON_SHEETS, ENEMY_SHEETS, FX_SHEETS, GROUND, ICON_SHEETS, PICKUP_SHEETS, type SheetDef } from '../assets/manifest';
import { tagOf, type UpgradeId } from '../logic/attacks';
import type { FormId } from '../logic/types';
import { COLORS } from '../assets/manifest';
import { drawDragon, lookFor } from './dragon';
import { drawDecor, drawFx, drawGround, drawIcon, drawPickup, DECOR_FRAMES } from './items';
import { drawKnight, type KnightKind } from './knight';
import { PixelCanvas } from './pixel';

const dragonKeys = new Set(Object.values(DRAGON_SHEETS).map((s) => s.key));
const enemyKeys = new Set(Object.values(ENEMY_SHEETS).map((s) => s.key));
const fxKeys = new Set(Object.values(FX_SHEETS).map((s) => s.key));
const pickupKeys = new Set(Object.values(PICKUP_SHEETS).map((s) => s.key));
const iconIds = new Map(Object.entries(ICON_SHEETS).map(([id, s]) => [s.key, id as UpgradeId]));

function drawFrame(def: SheetDef, frame: number): PixelCanvas {
  const S = def.frameWidth;
  if (dragonKeys.has(def.key)) return drawDragon(S, frame, lookFor(def.key as FormId));
  if (enemyKeys.has(def.key)) return drawKnight(S, frame, def.key as KnightKind);
  if (fxKeys.has(def.key)) return drawFx(def.key, S, frame);
  if (pickupKeys.has(def.key)) return drawPickup(def.key, S, frame);
  const icon = iconIds.get(def.key);
  if (icon) return drawIcon(icon, COLORS[tagOf(icon)]);
  if (def.key === GROUND.key) return drawGround(S);
  throw new Error(`no art for ${def.key}`);
}

/** Renders a whole spritesheet (all frames in one row) for a manifest entry. */
export function renderSheet(def: SheetDef): PixelCanvas {
  const sheet = new PixelCanvas(def.frameWidth * def.frames, def.frameHeight);
  for (let f = 0; f < def.frames; f++) sheet.blit(drawFrame(def, f), f * def.frameWidth, 0);
  return sheet;
}

export const DECOR_KEY = 'decor';
export function renderDecor(): PixelCanvas {
  const sheet = new PixelCanvas(16 * DECOR_FRAMES, 16);
  for (let f = 0; f < DECOR_FRAMES; f++) sheet.blit(drawDecor(f), f * 16, 0);
  return sheet;
}

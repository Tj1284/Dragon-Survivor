import type { EnemyTypeId } from '../config/balance';
import { ALL_FORMS } from '../logic/evolution';
import type { FormId, Tag } from '../logic/types';
import { UPGRADES, type UpgradeId } from '../logic/upgrades';

export interface SheetDef { key: string; path: string; frameWidth: number; frameHeight: number; frames: number; color: number }

export const COLORS: Record<Tag, number> = { fire: 0xe8542a, ice: 0x6cc6f0, lightning: 0xf5d742, neutral: 0xb08cff };

const sheet = (key: string, path: string, size: number, frames: number, color: number): SheetDef =>
  ({ key, path, frameWidth: size, frameHeight: size, frames, color });

const DRAGON_SIZE = { hatchling: 24, young: 32, adult: 48, legendary: 64 } as const;

function dragonSheet(id: FormId): SheetDef {
  const [stage, element] = id.split('_') as [keyof typeof DRAGON_SIZE, Tag | undefined];
  return sheet(id, `art/dragons/${id}.png`, DRAGON_SIZE[stage], 6, element ? COLORS[element] : 0x8fd16a);
}

export const DRAGON_SHEETS = Object.fromEntries(ALL_FORMS.map((id) => [id, dragonSheet(id)])) as Record<FormId, SheetDef>;

const enemy = (id: EnemyTypeId | 'boss', size: number, color: number) => sheet(id, `art/enemies/${id}.png`, size, 4, color);
export const ENEMY_SHEETS: Record<EnemyTypeId | 'boss', SheetDef> = {
  squire: enemy('squire', 24, 0x9aa3ad),
  archer: enemy('archer', 24, 0x5f8a3c),
  lancer: enemy('lancer', 32, 0xa0603a),
  netter: enemy('netter', 24, 0x7a6a52),
  heavy: enemy('heavy', 32, 0x5a5f6b),
  cleric: enemy('cleric', 24, 0xe6e0c8),
  boss: enemy('boss', 96, 0x8a1f2c),
};

export type FxKey = 'spit' | 'fire_zone' | 'ice_shard' | 'lightning_bolt' | 'arrow' | 'net' | 'fire_orb';
const fx = (key: FxKey, size: number, frames: number, color: number) => sheet(key, `art/fx/${key}.png`, size, frames, color);
export const FX_SHEETS: Record<FxKey, SheetDef> = {
  spit: fx('spit', 8, 2, 0x8fd16a),
  fire_zone: fx('fire_zone', 32, 4, COLORS.fire),
  ice_shard: fx('ice_shard', 8, 2, COLORS.ice),
  lightning_bolt: fx('lightning_bolt', 16, 3, COLORS.lightning),
  arrow: fx('arrow', 8, 1, 0xd8c8a0),
  net: fx('net', 16, 1, 0xc0b090),
  fire_orb: fx('fire_orb', 12, 2, COLORS.fire),
};

export type PickupKey = 'gem_s' | 'gem_m' | 'gem_l' | 'gold';
const pickup = (key: PickupKey, size: number, frames: number, color: number) => sheet(key, `art/pickups/${key}.png`, size, frames, color);
export const PICKUP_SHEETS: Record<PickupKey, SheetDef> = {
  gem_s: pickup('gem_s', 6, 1, 0x4fd6a8),
  gem_m: pickup('gem_m', 8, 1, 0x3a9df0),
  gem_l: pickup('gem_l', 10, 1, 0xd05cf0),
  gold: pickup('gold', 8, 2, 0xf2c230),
};

export const ICON_SHEETS = Object.fromEntries(
  UPGRADES.map((u) => [u.id, sheet(`icon_${u.id}`, `art/icons/${u.id}.png`, 16, 1, COLORS[u.tag])]),
) as Record<UpgradeId, SheetDef>;

export const GROUND: SheetDef = sheet('ground', 'art/tiles/ground.png', 32, 1, 0x3b5b3a);

export const ALL_SHEETS: readonly SheetDef[] = [
  ...Object.values(DRAGON_SHEETS),
  ...Object.values(ENEMY_SHEETS),
  ...Object.values(FX_SHEETS),
  ...Object.values(PICKUP_SHEETS),
  ...Object.values(ICON_SHEETS),
  GROUND,
];

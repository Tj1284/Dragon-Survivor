import type { Element, Tag } from './types';

export type UpgradeId =
  | 'swift_wings' | 'thick_scales' | 'magnet' | 'fury' | 'quick_breath' | 'regen'
  | 'fire_orbit' | 'frost_shards' | 'thunder_strike'
  | 'ember_trail' | 'wider_flames' | 'searing' | 'fire_burst'
  | 'deep_chill' | 'shatter' | 'ice_armor' | 'frost_aura'
  | 'extra_jump' | 'static_charge' | 'overcharge' | 'spark_speed';

export interface UpgradeDef { id: UpgradeId; tag: Tag; kind: 'passive' | 'weapon'; maxLevel: number }
export type Owned = Partial<Record<UpgradeId, number>>;
export interface OfferContext { owned: Owned; element: Element | null }
export type Choice = { type: 'upgrade'; id: UpgradeId } | { type: 'fallback' };

const p = (id: UpgradeId, tag: Tag, maxLevel: number): UpgradeDef => ({ id, tag, kind: 'passive', maxLevel });
const w = (id: UpgradeId, tag: Element): UpgradeDef => ({ id, tag, kind: 'weapon', maxLevel: 5 });

export const UPGRADES: readonly UpgradeDef[] = [
  p('swift_wings', 'neutral', 5), p('thick_scales', 'neutral', 5), p('magnet', 'neutral', 3),
  p('fury', 'neutral', 5), p('quick_breath', 'neutral', 5), p('regen', 'neutral', 3),
  w('fire_orbit', 'fire'), w('frost_shards', 'ice'), w('thunder_strike', 'lightning'),
  p('ember_trail', 'fire', 3), p('wider_flames', 'fire', 3), p('searing', 'fire', 5), p('fire_burst', 'fire', 3),
  p('deep_chill', 'ice', 3), p('shatter', 'ice', 3), p('ice_armor', 'ice', 5), p('frost_aura', 'ice', 3),
  p('extra_jump', 'lightning', 5), p('static_charge', 'lightning', 3), p('overcharge', 'lightning', 3), p('spark_speed', 'lightning', 5),
];

export const UPGRADE_BY_ID: Record<UpgradeId, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<UpgradeId, UpgradeDef>;

export const WEAPON_OF: Record<Element, UpgradeId> = { fire: 'fire_orbit', ice: 'frost_shards', lightning: 'thunder_strike' };

export function availableUpgrades(ctx: OfferContext): UpgradeId[] {
  return UPGRADES.filter((u) => {
    if ((ctx.owned[u.id] ?? 0) >= u.maxLevel) return false;
    if (u.tag === 'neutral') return true;
    if (ctx.element !== null && u.tag !== ctx.element) return false;
    if (u.kind === 'weapon') return true;
    return ctx.element === u.tag || (ctx.owned[WEAPON_OF[u.tag]] ?? 0) > 0;
  }).map((u) => u.id);
}

export function rollChoices(ctx: OfferContext, rng: () => number, count = 3): Choice[] {
  const pool = availableUpgrades(ctx);
  if (pool.length === 0) return [{ type: 'fallback' }];
  const picked: Choice[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    picked.push({ type: 'upgrade', id: pool[i] });
    pool.splice(i, 1);
  }
  return picked;
}

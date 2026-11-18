import type { SaveData } from './save';

export type MetaId = 'vitality' | 'might' | 'agility' | 'greed' | 'wisdom' | 'reach';
export interface MetaDef { id: MetaId; maxLevel: number; baseCost: number }

const m = (id: MetaId, maxLevel: number, baseCost: number): MetaDef => ({ id, maxLevel, baseCost });

/** Permanent upgrades bought in the Lair with gold kept between runs. */
export const META: Record<MetaId, MetaDef> = {
  vitality: m('vitality', 5, 20),
  might: m('might', 5, 30),
  agility: m('agility', 3, 25),
  greed: m('greed', 5, 20),
  wisdom: m('wisdom', 5, 25),
  reach: m('reach', 3, 20),
};
export const META_IDS = Object.keys(META) as MetaId[];

/** Cost of the next level, from the current level. */
export function metaCost(id: MetaId, level: number): number {
  return Math.round(META[id].baseCost * Math.pow(level + 1, 1.6));
}

/** Returns the new save after buying one level, or null when gold is short or the upgrade is maxed. */
export function buyMeta(s: SaveData, id: MetaId): SaveData | null {
  const level = s.meta[id] ?? 0;
  if (level >= META[id].maxLevel) return null;
  const cost = metaCost(id, level);
  if (s.gold < cost) return null;
  return { ...s, gold: s.gold - cost, meta: { ...s.meta, [id]: level + 1 } };
}

export interface MetaBonus { maxHp: number; damageMult: number; speedMult: number; goldMult: number; xpMult: number; pickupMult: number }
export const NO_BONUS: MetaBonus = { maxHp: 0, damageMult: 1, speedMult: 1, goldMult: 1, xpMult: 1, pickupMult: 1 };

export function metaBonus(meta: SaveData['meta']): MetaBonus {
  const n = (id: MetaId) => meta[id] ?? 0;
  return {
    maxHp: 10 * n('vitality'),
    damageMult: 1 + 0.06 * n('might'),
    speedMult: 1 + 0.04 * n('agility'),
    goldMult: 1 + 0.1 * n('greed'),
    xpMult: 1 + 0.06 * n('wisdom'),
    pickupMult: 1 + 0.1 * n('reach'),
  };
}

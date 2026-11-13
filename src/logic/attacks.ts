import type { Element, Stage, Tag } from './types';

export type AttackId =
  | 'spit' | 'tail_swipe' | 'roar'
  | 'fire_breath' | 'fire_orbit' | 'meteor'
  | 'ice_breath' | 'frost_shards' | 'frost_aura'
  | 'lightning_breath' | 'thunder_strike' | 'static_field';
export type StatId = 'fury' | 'thick_scales' | 'quick_breath' | 'swift_wings' | 'regen' | 'armor' | 'magnet';
export type UpgradeId = AttackId | StatId;

export const MAX_SLOTS = 4;
export const MAX_LEVEL = 5;
/** Damage multiplier for attacks of the dragon's own element. */
export const AFFINITY = 1.25;

export interface AttackDef {
  id: AttackId; tag: Tag;
  /** Stat that unlocks the gold evolution; null = the attack can't evolve. */
  key: StatId | null;
  /** Whether it can show up as a new-attack card (the spit is the starter; breaths come from the dragon's evolution). */
  offered: boolean;
}

const atk = (id: AttackId, tag: Tag, key: StatId | null, offered: boolean): AttackDef => ({ id, tag, key, offered });

export const ATTACKS: Record<AttackId, AttackDef> = {
  spit: atk('spit', 'neutral', null, false),
  tail_swipe: atk('tail_swipe', 'neutral', 'thick_scales', true),
  roar: atk('roar', 'neutral', 'armor', true),
  fire_breath: atk('fire_breath', 'fire', 'fury', false),
  fire_orbit: atk('fire_orbit', 'fire', 'swift_wings', true),
  meteor: atk('meteor', 'fire', 'magnet', true),
  ice_breath: atk('ice_breath', 'ice', 'quick_breath', false),
  frost_shards: atk('frost_shards', 'ice', 'fury', true),
  frost_aura: atk('frost_aura', 'ice', 'regen', true),
  lightning_breath: atk('lightning_breath', 'lightning', 'quick_breath', false),
  thunder_strike: atk('thunder_strike', 'lightning', 'fury', true),
  static_field: atk('static_field', 'lightning', 'swift_wings', true),
};

export const ATTACK_IDS = Object.keys(ATTACKS) as AttackId[];
export const STAT_IDS: StatId[] = ['fury', 'thick_scales', 'quick_breath', 'swift_wings', 'regen', 'armor', 'magnet'];
export const UPGRADE_IDS: UpgradeId[] = [...ATTACK_IDS, ...STAT_IDS];

export type Owned = Partial<Record<UpgradeId, number>>;
export interface Loadout { owned: Owned; element: Element | null; gold: AttackId[] }
export type Choice = { type: 'upgrade'; id: UpgradeId } | { type: 'gold'; id: AttackId } | { type: 'fallback' };

export function isAttack(id: UpgradeId): id is AttackId {
  return id in ATTACKS;
}

export function tagOf(id: UpgradeId): Tag {
  return isAttack(id) ? ATTACKS[id].tag : 'neutral';
}

export function heldAttacks(owned: Owned): AttackId[] {
  return ATTACK_IDS.filter((id) => (owned[id] ?? 0) > 0);
}

export function availableUpgrades(l: Loadout): UpgradeId[] {
  const held = heldAttacks(l.owned);
  const out: UpgradeId[] = [];
  for (const id of ATTACK_IDS) {
    const level = l.owned[id] ?? 0;
    if (level > 0) {
      if (level < MAX_LEVEL) out.push(id);
      continue;
    }
    const def = ATTACKS[id];
    if (!def.offered || held.length >= MAX_SLOTS) continue;
    if (def.tag !== 'neutral' && l.element !== null && def.tag !== l.element) continue;
    out.push(id);
  }
  for (const id of STAT_IDS) if ((l.owned[id] ?? 0) < MAX_LEVEL) out.push(id);
  return out;
}

/** Attacks at max level whose key stat is owned and that aren't gold yet, in ATTACK_IDS order. */
export function eligibleGold(l: Loadout): AttackId[] {
  return ATTACK_IDS.filter((id) => {
    const key = ATTACKS[id].key;
    return key !== null && (l.owned[id] ?? 0) >= MAX_LEVEL && (l.owned[key] ?? 0) >= 1 && !l.gold.includes(id);
  });
}

export function rollChoices(l: Loadout, rng: () => number, count = 3): Choice[] {
  const picked: Choice[] = [];
  const gold = eligibleGold(l);
  if (gold.length > 0) picked.push({ type: 'gold', id: gold[0] });
  const pool = availableUpgrades(l);
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(rng() * pool.length);
    picked.push({ type: 'upgrade', id: pool[i] });
    pool.splice(i, 1);
  }
  return picked.length > 0 ? picked : [{ type: 'fallback' }];
}

export function breathFor(e: Element): AttackId {
  return `${e}_breath` as AttackId;
}

/** Returns a copy where the spit's level has moved to the breath of the element. */
export function spitToBreath(owned: Owned, e: Element): Owned {
  const { spit, ...rest } = owned;
  return spit ? { ...rest, [breathFor(e)]: spit } : rest;
}

// ---------- numbers per level ----------

export interface AttackParams {
  damage: number; cooldown: number; count: number; radius: number;
  /** Attack-specific: chain jumps, knockback, slow, targets or fire-zone radius. */
  extra: number;
}

type Row = { damage: number[]; cooldown: number[]; count: number[]; radius: number[]; extra: number[] };
const five = (v: number): number[] => [v, v, v, v, v];

const TABLE: Record<AttackId, Row> = {
  spit: { damage: [12, 15, 15, 19, 19], cooldown: [0.7, 0.7, 0.65, 0.6, 0.55], count: [1, 1, 2, 2, 3], radius: five(4), extra: five(0) },
  fire_breath: { damage: [14, 17, 17, 21, 21], cooldown: [0.9, 0.9, 0.85, 0.8, 0.75], count: [1, 1, 2, 2, 3], radius: five(5), extra: [18, 18, 21, 21, 24] },
  ice_breath: { damage: [8, 10, 10, 12, 12], cooldown: [0.8, 0.8, 0.75, 0.7, 0.65], count: [3, 3, 4, 4, 5], radius: five(4), extra: five(0) },
  lightning_breath: { damage: [12, 14, 14, 17, 17], cooldown: [0.9, 0.85, 0.8, 0.75, 0.7], count: five(1), radius: five(60), extra: [3, 3, 4, 5, 6] },
  tail_swipe: { damage: [16, 20, 24, 28, 34], cooldown: [1.6, 1.5, 1.4, 1.3, 1.2], count: five(1), radius: [34, 36, 40, 44, 48], extra: five(0) },
  roar: { damage: [8, 10, 12, 14, 16], cooldown: [4, 3.7, 3.4, 3.1, 2.8], count: five(1), radius: [50, 55, 60, 65, 70], extra: [30, 34, 38, 42, 46] },
  fire_orbit: { damage: [6, 7, 8, 9, 10], cooldown: five(0.5), count: [1, 2, 3, 4, 5], radius: five(36), extra: five(2) },
  meteor: { damage: [24, 30, 36, 42, 50], cooldown: [3, 2.8, 2.6, 2.4, 2.2], count: five(1), radius: [22, 24, 26, 28, 30], extra: five(0) },
  frost_shards: { damage: [7, 8, 9, 10, 12], cooldown: five(2), count: [2, 3, 4, 5, 6], radius: five(4), extra: five(0) },
  frost_aura: { damage: [2, 3, 4, 5, 6], cooldown: five(0.5), count: five(1), radius: [40, 44, 48, 52, 56], extra: [0.2, 0.3, 0.4, 0.5, 0.6] },
  thunder_strike: { damage: [20, 24, 28, 32, 38], cooldown: [3.2, 2.9, 2.6, 2.3, 2], count: [1, 1, 1, 2, 2], radius: five(16), extra: five(0) },
  static_field: { damage: [8, 10, 12, 14, 16], cooldown: [1.5, 1.4, 1.3, 1.2, 1.1], count: five(1), radius: [50, 54, 58, 62, 66], extra: [2, 3, 4, 5, 6] },
};

/** Numeric changes of each gold version; behaviour changes (stun, pierce, freeze...) live in the weapon classes. */
const GOLD: Partial<Record<AttackId, (p: AttackParams) => AttackParams>> = {
  fire_breath: (p) => ({ ...p, extra: p.extra * 1.6 }),
  ice_breath: (p) => ({ ...p, count: 9 }),
  lightning_breath: (p) => ({ ...p, extra: p.extra * 2 }),
  tail_swipe: (p) => ({ ...p, radius: p.radius * 1.5, extra: 30 }),
  roar: (p) => ({ ...p, count: 2 }),
  fire_orbit: (p) => ({ ...p, count: 8, radius: 48, damage: p.damage * 1.5, extra: 3 }),
  meteor: (p) => ({ ...p, count: 3 }),
  frost_shards: (p) => ({ ...p, extra: 1 }),
  frost_aura: (p) => ({ ...p, count: 2 }),
  thunder_strike: (p) => ({ ...p, count: 5 }),
  static_field: (p) => ({ ...p, count: 3 }),
};

export function attackParams(id: AttackId, level: number, gold: boolean): AttackParams {
  const i = Math.min(MAX_LEVEL, Math.max(1, level)) - 1;
  const row = TABLE[id];
  const base: AttackParams = { damage: row.damage[i], cooldown: row.cooldown[i], count: row.count[i], radius: row.radius[i], extra: row.extra[i] };
  const evolve = gold ? GOLD[id] : undefined;
  return evolve ? evolve(base) : base;
}

// ---------- player stats ----------

export interface PlayerStats { maxHp: number; speed: number; damageMult: number; cooldownMult: number; pickupRadius: number; regen: number; armor: number }

export const BASE_STATS: PlayerStats = { maxHp: 100, speed: 70, damageMult: 1, cooldownMult: 1, pickupRadius: 40, regen: 0, armor: 0 };

export const STAGE_BONUS: Record<Stage, { maxHp: number; damageMult: number; pickupRadius: number }> = {
  0: { maxHp: 0, damageMult: 1, pickupRadius: 0 },
  1: { maxHp: 25, damageMult: 1.3, pickupRadius: 8 },
  2: { maxHp: 50, damageMult: 1.7, pickupRadius: 16 },
  3: { maxHp: 100, damageMult: 2.3, pickupRadius: 24 },
};

export const FALLBACK = { healFraction: 0.3, gold: 5 };

export function computeStats(stage: Stage, owned: Owned): PlayerStats {
  const n = (id: StatId) => owned[id] ?? 0;
  const bonus = STAGE_BONUS[stage];
  return {
    maxHp: BASE_STATS.maxHp + bonus.maxHp + 20 * n('thick_scales'),
    speed: BASE_STATS.speed * (1 + 0.08 * n('swift_wings')),
    damageMult: BASE_STATS.damageMult * bonus.damageMult * (1 + 0.1 * n('fury')),
    cooldownMult: BASE_STATS.cooldownMult * Math.pow(0.92, n('quick_breath')),
    pickupRadius: (BASE_STATS.pickupRadius + bonus.pickupRadius) * (1 + 0.2 * n('magnet')),
    regen: BASE_STATS.regen + 0.5 * n('regen'),
    armor: BASE_STATS.armor + n('armor'),
  };
}

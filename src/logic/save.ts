import { ALL_FORMS } from './evolution';
import { META, type MetaId } from './meta';
import type { FormId } from './types';

export interface SaveData {
  v: 1;
  gold: number;
  meta: Partial<Record<MetaId, number>>;
  collection: FormId[];
  bestTime: number;
  wins: number;
  /** False until the first run ends: the very first visit skips the menu. */
  played: boolean;
  /** Sound off (effects and music). */
  muted: boolean;
}

export function defaultSave(): SaveData {
  return { v: 1, gold: 0, meta: {}, collection: [], bestTime: 0, wins: 0, played: false, muted: false };
}

const MAX_NUMBER = 1e9;
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(MAX_NUMBER, Math.max(0, Math.floor(v))) : 0);

/** Never throws: anything unreadable falls back to the default, keeping every field that is valid. */
export function parseSave(raw: string | null): SaveData {
  const s = defaultSave();
  if (!raw) return s;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return s; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return s;
  const d = data as Record<string, unknown>;
  s.gold = count(d.gold);
  s.bestTime = count(d.bestTime);
  s.wins = count(d.wins);
  s.played = d.played === true;
  s.muted = d.muted === true;
  if (d.meta && typeof d.meta === 'object') {
    for (const [id, level] of Object.entries(d.meta as Record<string, unknown>)) {
      if (!(id in META) || typeof level !== 'number' || !Number.isFinite(level)) continue;
      const clamped = Math.min(META[id as MetaId].maxLevel, Math.max(0, Math.floor(level)));
      if (clamped > 0) s.meta[id as MetaId] = clamped;
    }
  }
  if (Array.isArray(d.collection)) {
    for (const f of d.collection) if (ALL_FORMS.includes(f as FormId) && !s.collection.includes(f as FormId)) s.collection.push(f as FormId);
  }
  return s;
}

export function serializeSave(s: SaveData): string {
  return JSON.stringify(s);
}

/** Adds forms to the collection without touching anything else. */
export function addForms(s: SaveData, forms: readonly FormId[]): SaveData {
  const missing = forms.filter((f) => !s.collection.includes(f));
  return missing.length ? { ...s, collection: [...s.collection, ...missing] } : s;
}

export function addRunResult(s: SaveData, r: { gold: number; time: number; won: boolean; forms: readonly FormId[] }): SaveData {
  const collection = [...s.collection];
  for (const f of r.forms) if (!collection.includes(f)) collection.push(f);
  return {
    ...s,
    gold: Math.min(MAX_NUMBER, s.gold + count(r.gold)),
    bestTime: Math.max(s.bestTime, count(r.time)),
    wins: s.wins + (r.won ? 1 : 0),
    played: true,
    collection,
  };
}

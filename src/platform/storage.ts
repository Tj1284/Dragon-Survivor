import { defaultSave, parseSave, serializeSave, type SaveData } from '../logic/save';
import { platform } from './bridge';

/** Where the game keeps its save. Loads are synchronous from a copy read once at startup. */
export interface Storage { load(): SaveData; save(s: SaveData): void }

export const SAVE_KEY = 'dragon-survivor-save';

/** A save kept in memory and written through to the platform on every (meaningful) change. */
export function createCachedStorage(initial: string | null, write: (json: string) => void): Storage {
  let current: SaveData;
  try { current = parseSave(initial); } catch { current = defaultSave(); }
  return {
    load: () => current,
    save(s) {
      current = s;
      try { write(serializeSave(s)); } catch { /* not persisted this time */ }
    },
  };
}

let impl: Storage = createCachedStorage(null, () => {});

/** Reads the save through the Playgama Bridge (cloud saves where the platform has them). Call once, before the game starts. */
export async function initStorage(): Promise<void> {
  const raw = await platform.storageGet(SAVE_KEY);
  impl = createCachedStorage(raw, (json) => platform.storageSet(SAVE_KEY, json));
}

export const storage: Storage = { load: () => impl.load(), save: (s) => impl.save(s) };

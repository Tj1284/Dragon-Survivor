import { defaultSave, parseSave, serializeSave, type SaveData } from '../logic/save';

/** Where the game keeps its save. Plan 4 swaps the implementation for the platform SDK. */
export interface Storage { load(): SaveData; save(s: SaveData): void }

type Backend = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export const SAVE_KEY = 'dragon-survivor-save';

/** localStorage-backed save. Every access is guarded: private mode or blocked storage just means no persistence. */
export function createLocalStorage(key = SAVE_KEY, backend?: Backend): Storage {
  const store = (): Backend | null => {
    try { return backend ?? globalThis.localStorage ?? null; } catch { return null; }
  };
  return {
    load() {
      try { return parseSave(store()?.getItem(key) ?? null); } catch { return defaultSave(); }
    },
    save(s) {
      try { store()?.setItem(key, serializeSave(s)); } catch { /* not persisted this time */ }
    },
  };
}

export const storage: Storage = createLocalStorage();

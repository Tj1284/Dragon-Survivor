import type { Element, Stage, Tag } from '../logic/types';
import type { Owned } from '../logic/upgrades';

export interface RunState {
  level: number; xp: number; gold: number; elapsed: number;
  owned: Owned; picks: Tag[];
  element: Element | null; stage: Stage; pendingLevels: number;
}

export function createRunState(): RunState {
  return { level: 1, xp: 0, gold: 0, elapsed: 0, owned: {}, picks: [], element: null, stage: 0, pendingLevels: 0 };
}

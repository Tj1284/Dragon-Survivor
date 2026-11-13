import type { Element, Stage, Tag } from '../logic/types';
import type { AttackId, Owned } from '../logic/attacks';

export interface RunState {
  level: number; xp: number; gold: number; elapsed: number;
  owned: Owned; picks: Tag[];
  /** Attacks that have taken their gold evolution (not to be confused with `gold`, the coins). */
  goldAttacks: AttackId[];
  element: Element | null; stage: Stage; pendingLevels: number;
}

export function createRunState(): RunState {
  return { level: 1, xp: 0, gold: 0, elapsed: 0, owned: { spit: 1 }, picks: [], goldAttacks: [], element: null, stage: 0, pendingLevels: 0 };
}

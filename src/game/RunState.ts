import type { Element, FormId, Stage, Tag } from '../logic/types';
import type { AttackId, Owned } from '../logic/attacks';

export interface RunState {
  level: number; xp: number; gold: number; elapsed: number;
  owned: Owned; picks: Tag[];
  /** Attacks that have taken their gold evolution (not to be confused with `gold`, the coins). */
  goldAttacks: AttackId[];
  element: Element | null; stage: Stage; pendingLevels: number;
  /** True once the final boss is beaten. */
  won: boolean;
  /** Random id: the game-over screen uses it to add a run's gold to the save only once. */
  id: number;
  /** Dragon forms reached this run, for the Collection. */
  forms: FormId[];
  /** Gold already added to the save (when the app went to the background); the game-over screen adds the rest. */
  bankedGold: number;
  /** Held attacks in the order they were picked (HUD icon order). */
  attackOrder: AttackId[];
}

export function createRunState(): RunState {
  return { level: 1, xp: 0, gold: 0, elapsed: 0, owned: { spit: 1 }, picks: [], goldAttacks: [], element: null, stage: 0, pendingLevels: 0, won: false, id: Math.floor(Math.random() * 2 ** 31), forms: ['hatchling'], bankedGold: 0, attackOrder: ['spit'] };
}

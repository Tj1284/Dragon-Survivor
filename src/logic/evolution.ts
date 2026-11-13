import { ELEMENTS, type Element, type FormId, type Stage, type Tag } from './types';

export const EVOLUTION_LEVELS = [5, 12, 20] as const;
const STAGE_NAMES = ['young', 'adult', 'legendary'] as const;

export function stageForLevel(level: number): Stage {
  let stage = 0;
  for (const threshold of EVOLUTION_LEVELS) if (level >= threshold) stage++;
  return stage as Stage;
}

/** Most picked element; ties go to the element picked most recently; no element picks → 'choose'. */
export function chooseElement(picks: readonly Tag[]): Element | 'choose' {
  const count = new Map<Element, number>();
  const last = new Map<Element, number>();
  picks.forEach((tag, i) => {
    if (tag === 'neutral') return;
    count.set(tag, (count.get(tag) ?? 0) + 1);
    last.set(tag, i);
  });
  let best: Element | null = null;
  for (const el of ELEMENTS) {
    const c = count.get(el) ?? 0;
    if (c === 0) continue;
    if (best === null) { best = el; continue; }
    const bc = count.get(best)!;
    if (c > bc || (c === bc && last.get(el)! > last.get(best)!)) best = el;
  }
  return best ?? 'choose';
}

export function formId(stage: Stage, element: Element | null): FormId {
  if (stage === 0) return 'hatchling';
  if (element === null) throw new Error(`stage ${stage} needs an element`);
  return `${STAGE_NAMES[stage - 1]}_${element}`;
}

export const ALL_FORMS: readonly FormId[] = [
  'hatchling',
  ...STAGE_NAMES.flatMap((s) => ELEMENTS.map((e) => `${s}_${e}` as FormId)),
];

export type Element = 'fire' | 'ice' | 'lightning';
export type Tag = Element | 'neutral';
/** 0 = cría, 1 = joven, 2 = adulto, 3 = legendario */
export type Stage = 0 | 1 | 2 | 3;
export type FormId = 'hatchling' | `${'young' | 'adult' | 'legendary'}_${Element}`;
export const ELEMENTS: readonly Element[] = ['fire', 'ice', 'lightning'];

import { expect, it } from 'vitest';
import { ALL_FORMS, chooseElement, formId, stageForLevel } from '../../src/logic/evolution';

it('stage thresholds are 5 / 12 / 20', () => {
  expect([1, 4, 5, 11, 12, 19, 20, 40].map(stageForLevel)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
});
it('chooseElement picks the most picked element, ties to the most recent', () => {
  expect(chooseElement(['fire', 'ice', 'fire', 'neutral'])).toBe('fire');
  expect(chooseElement(['fire', 'ice'])).toBe('ice');
  expect(chooseElement(['ice', 'fire', 'fire', 'ice'])).toBe('ice');
});
it('chooseElement asks the player when there are no element picks', () => {
  expect(chooseElement(['neutral', 'neutral'])).toBe('choose');
  expect(chooseElement([])).toBe('choose');
});
it('formId maps stage and element to the 10 forms', () => {
  expect(formId(0, null)).toBe('hatchling');
  expect(formId(2, 'ice')).toBe('adult_ice');
  expect(() => formId(1, null)).toThrow();
  expect(new Set(ALL_FORMS).size).toBe(10);
});

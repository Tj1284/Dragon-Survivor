import { expect, it } from 'vitest';
import { setLanguage, t } from '../../src/i18n';

it('translates to Spanish and falls back to English for unknown languages', () => {
  setLanguage('es'); expect(t('again')).toBe('Otra vez');
  setLanguage('fr'); expect(t('again')).toBe('Again');
  setLanguage('es-MX'); expect(t('again')).toBe('Otra vez');
});
it('returns the key when missing and fills variables', () => {
  setLanguage('es');
  expect(t('no_such_key')).toBe('no_such_key');
  expect(t('level_n', { n: 3 })).toBe('Nivel 3');
});

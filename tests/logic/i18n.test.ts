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

import { UPGRADES } from '../../src/logic/upgrades';
it('every upgrade has a name and description in Spanish and English', () => {
  for (const lang of ['es', 'en']) {
    setLanguage(lang);
    for (const u of UPGRADES) {
      expect(t(`up_${u.id}`)).not.toBe(`up_${u.id}`);
      expect(t(`up_${u.id}_d`)).not.toBe(`up_${u.id}_d`);
    }
  }
});

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

import { ATTACKS, ATTACK_IDS, UPGRADE_IDS } from '../../src/logic/attacks';
it('every attack, stat and gold evolution has a name and description in Spanish and English', () => {
  const keys = [
    ...UPGRADE_IDS.flatMap((id) => [`up_${id}`, `up_${id}_d`]),
    ...ATTACK_IDS.filter((id) => ATTACKS[id].key).flatMap((id) => [`gold_${id}`, `gold_${id}_d`]),
    'gold_label',
  ];
  for (const lang of ['es', 'en']) {
    setLanguage(lang);
    for (const key of keys) expect(t(key), `${lang}:${key}`).not.toBe(key);
  }
});

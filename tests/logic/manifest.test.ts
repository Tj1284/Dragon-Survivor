import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { ALL_SHEETS, DRAGON_SHEETS, ENEMY_SHEETS, ICON_SHEETS } from '../../src/assets/manifest';
import { UPGRADES } from '../../src/logic/upgrades';

it('has the 10 dragon forms with the agreed frame sizes', () => {
  expect(Object.keys(DRAGON_SHEETS)).toHaveLength(10);
  expect(DRAGON_SHEETS.hatchling.frameWidth).toBe(24);
  expect(DRAGON_SHEETS.young_fire.frameWidth).toBe(32);
  expect(DRAGON_SHEETS.adult_ice.frameWidth).toBe(48);
  expect(DRAGON_SHEETS.legendary_lightning.frameHeight).toBe(64);
  expect(DRAGON_SHEETS.hatchling.frames).toBe(6);
});
it('has enemies and the boss at their sizes', () => {
  expect(ENEMY_SHEETS.squire.frameWidth).toBe(24);
  expect(ENEMY_SHEETS.heavy.frameWidth).toBe(32);
  expect(ENEMY_SHEETS.boss.frameWidth).toBe(96);
  expect(ENEMY_SHEETS.squire.frames).toBe(4);
});
it('has unique keys and an icon per upgrade', () => {
  expect(new Set(ALL_SHEETS.map((s) => s.key)).size).toBe(ALL_SHEETS.length);
  for (const u of UPGRADES) expect(ICON_SHEETS[u.id]).toBeDefined();
});
it('documents every asset path for the artist', () => {
  const doc = readFileSync('docs/ASSETS.md', 'utf8');
  for (const s of ALL_SHEETS) expect(doc).toContain(s.path);
});

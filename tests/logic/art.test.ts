import { expect, it } from 'vitest';
import { ALL_SHEETS, DRAGON_SHEETS } from '../../src/assets/manifest';
import { renderSheet } from '../../src/art';

it('draws every sheet at its exact size, with something visible in every frame', () => {
  for (const def of ALL_SHEETS) {
    const sheet = renderSheet(def);
    expect(sheet.width, def.key).toBe(def.frameWidth * def.frames);
    expect(sheet.height, def.key).toBe(def.frameHeight);
    for (let f = 0; f < def.frames; f++) {
      const frame = sheet.crop(f * def.frameWidth, 0, def.frameWidth, def.frameHeight);
      expect(frame.opaqueCount() / (def.frameWidth * def.frameHeight), `${def.key} frame ${f}`).toBeGreaterThan(0.08);
    }
  }
});
it('dragon flight cycles actually animate', () => {
  for (const def of Object.values(DRAGON_SHEETS)) {
    const sheet = renderSheet(def);
    const a = sheet.crop(0, 0, def.frameWidth, def.frameHeight).hash();
    const b = sheet.crop(2 * def.frameWidth, 0, def.frameWidth, def.frameHeight).hash();
    expect(a, def.key).not.toBe(b);
  }
});
it('evolved forms of different elements look different', () => {
  const h = (k: keyof typeof DRAGON_SHEETS) => renderSheet(DRAGON_SHEETS[k]).hash();
  expect(new Set([h('adult_fire'), h('adult_ice'), h('adult_lightning')]).size).toBe(3);
});

import { lookFor } from '../../src/art/dragon';
it('generated lightning dragons are yellow, matching the hand-drawn young form', () => {
  for (const id of ['adult_lightning', 'legendary_lightning'] as const) {
    const body = lookFor(id).body;
    const r = (body >> 16) & 0xff, g = (body >> 8) & 0xff, b = body & 0xff;
    expect(r, id).toBeGreaterThan(200);
    expect(g, id).toBeGreaterThan(160);
    expect(b, id).toBeLessThan(120);
  }
});

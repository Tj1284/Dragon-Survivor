import { expect, it } from 'vitest';
import { computeStats } from '../../src/logic/attacks';
import { buyMeta, metaBonus, metaCost } from '../../src/logic/meta';
import { addRunResult, defaultSave, parseSave, serializeSave } from '../../src/logic/save';
import { createLocalStorage } from '../../src/platform/storage';

it('reading a missing or broken save gives a fresh one', () => {
  expect(parseSave(null)).toEqual(defaultSave());
  expect(parseSave('{roto')).toEqual(defaultSave());
  expect(parseSave('42')).toEqual(defaultSave());
});
it('keeps what can be read and cleans the rest', () => {
  const raw = JSON.stringify({ gold: -50, meta: { might: 99, nope: 3, greed: 'x' }, collection: ['adult_ice', 'x', 'adult_ice'], played: 'yes', wins: 2.7 });
  expect(parseSave(raw)).toEqual({ ...defaultSave(), gold: 0, meta: { might: 5 }, collection: ['adult_ice'], played: false, wins: 2 });
});
it('round-trips', () => {
  const s = { ...defaultSave(), gold: 120, wins: 2, collection: ['hatchling' as const], played: true };
  expect(parseSave(serializeSave(s))).toEqual(s);
});
it('adds a run result once per call', () => {
  const r = addRunResult(defaultSave(), { gold: 40, time: 200, won: false, forms: ['hatchling', 'young_fire'] });
  expect(r).toMatchObject({ gold: 40, bestTime: 200, wins: 0, played: true, collection: ['hatchling', 'young_fire'] });
  expect(addRunResult(r, { gold: 10, time: 100, won: true, forms: ['young_fire'] })).toMatchObject({ gold: 50, bestTime: 200, wins: 1, collection: ['hatchling', 'young_fire'] });
});
it('lair upgrades cost more each level and never overdraw', () => {
  expect(metaCost('might', 0)).toBe(30);
  expect(metaCost('might', 1)).toBe(91);
  expect(buyMeta({ ...defaultSave(), gold: 29 }, 'might')).toBeNull();
  expect(buyMeta({ ...defaultSave(), gold: 100 }, 'might')).toMatchObject({ gold: 70, meta: { might: 1 } });
  expect(buyMeta({ ...defaultSave(), gold: 1e6, meta: { agility: 3 } }, 'agility')).toBeNull();
});
it('lair bonuses feed the run stats', () => {
  expect(metaBonus({})).toEqual({ maxHp: 0, damageMult: 1, speedMult: 1, goldMult: 1, xpMult: 1, pickupMult: 1 });
  const b = metaBonus({ vitality: 2, might: 5 });
  expect(b.maxHp).toBe(20);
  expect(b.damageMult).toBeCloseTo(1.3);
  const s = computeStats(0, {}, metaBonus({ vitality: 1, agility: 3 }));
  expect(s.maxHp).toBe(110);
  expect(s.speed).toBeCloseTo(70 * 1.12);
});
it('a storage that throws (private mode, blocked) still loads and saves without crashing', () => {
  const broken = createLocalStorage('k', { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
  expect(broken.load()).toEqual(defaultSave());
  expect(() => broken.save(defaultSave())).not.toThrow();
  const mem = new Map<string, string>();
  const ok = createLocalStorage('k', { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => { mem.set(k, v); } });
  ok.save({ ...defaultSave(), gold: 7 });
  expect(ok.load().gold).toBe(7);
});

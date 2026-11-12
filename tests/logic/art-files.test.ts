import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { ALL_SHEETS } from '../../src/assets/manifest';

function pngs(dir: string): string[] {
  let out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(pngs(p));
    else if (name.endsWith('.png')) out.push(p);
  }
  return out;
}

it('every PNG dropped in art/ has a manifest name and the exact sheet size', () => {
  const byPath = new Map(ALL_SHEETS.map((s) => [s.path, s]));
  for (const file of pngs('art')) {
    const def = byPath.get(file.replace(/\\/g, '/'));
    expect(def, `${file} doesn't match any name in docs/ASSETS.md`).toBeDefined();
    const buf = readFileSync(file);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    expect([w, h], file).toEqual([def!.frameWidth * def!.frames, def!.frameHeight]);
  }
});

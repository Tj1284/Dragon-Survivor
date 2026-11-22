import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { MUSIC_TRACKS, SFX_NAMES } from '../../src/audio/catalog';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
}

it('no sound is synthesized in code (Playgama 3.3.2 accepts only recorded or produced audio files)', () => {
  for (const f of files('src')) {
    const src = readFileSync(f, 'utf8');
    expect(src, f).not.toMatch(/createOscillator|createBuffer\(|getChannelData/);
  }
});
it('every sound effect and music track has its MP3 file', () => {
  for (const name of SFX_NAMES) expect(existsSync(`audio/sfx/${name}.mp3`), name).toBe(true);
  for (const name of MUSIC_TRACKS) expect(existsSync(`audio/music/${name}.mp3`), name).toBe(true);
});
it('the audio credits name the CC0 source', () => {
  const credits = readFileSync('docs/CREDITS.md', 'utf8');
  expect(credits).toMatch(/Juhani Junkala/);
  expect(credits).toMatch(/CC0/);
});

it('game code never touches browser storage or the Esc key (Playgama: saves go through Bridge storage; 1.5.2)', () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.ts$/.test(name) && /localStorage|sessionStorage|indexedDB|document\.cookie|keydown-ESC|'Escape'/.test(readFileSync(p, 'utf8'))) offenders.push(p);
    }
  };
  walk('src');
  expect(offenders).toEqual([]);
});

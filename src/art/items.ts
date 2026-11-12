import { hex, mix, PixelCanvas, shade, withAlpha, type Color } from './pixel';

const OUT = hex(0x15131c);

// ---------- projectiles and effects ----------

export function drawFx(key: string, S: number, frame: number): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const c = S / 2;
  switch (key) {
    case 'spit':
      pc.ellipse(c, c, S * 0.36, S * 0.36, (_dx, dy) => shade(hex(0x8fe06a), 1.15 - dy * 0.4));
      pc.set(c - 1, c - 1 - (frame % 2), hex(0xffffff));
      break;
    case 'fire_orb': {
      const r = S * (frame % 2 ? 0.42 : 0.38);
      pc.ellipse(c, c, r, r, hex(0xe8542a));
      pc.ellipse(c + 0.5, c - 0.5, r * 0.65, r * 0.65, hex(0xffa23a));
      pc.ellipse(c + 1, c - 1, r * 0.3, r * 0.3, hex(0xfff2a8));
      return pc;
    }
    case 'ice_shard':
      pc.poly([[0.5, c], [c, 1], [S - 0.5, c], [c, S - 1]], hex(0x8fdcff));
      pc.poly([[c - 1, c], [c, 2], [c + 1, c]], hex(0xffffff));
      if (frame % 2) pc.set(c + 1, c + 1, hex(0xffffff));
      break;
    case 'lightning_bolt': {
      const arms = frame === 1 ? 6 : 4;
      for (let i = 0; i < arms; i++) {
        const a = (i / arms) * Math.PI * 2 + frame * 0.4;
        pc.line(c, c, c + Math.cos(a) * S * 0.45, c + Math.sin(a) * S * 0.45, 1, hex(0xfff27a));
      }
      pc.ellipse(c, c, S * 0.18, S * 0.18, hex(0xffffff));
      return pc;
    }
    case 'arrow':
      pc.line(0, c, S - 2, c, 1, hex(0x9a6a3a));
      pc.poly([[S, c], [S - 3, c - 2], [S - 3, c + 2]], hex(0xdfe4ea));
      pc.line(0, c - 1, 2, c - 1, 1, hex(0xf2f2f2));
      pc.line(0, c + 1, 2, c + 1, 1, hex(0xf2f2f2));
      return pc;
    case 'net': {
      const r = S * 0.45;
      pc.ellipse(c, c, r, r, withAlpha(hex(0xd8c49a), 120));
      for (let i = -3; i <= 3; i++) {
        pc.line(c + i * r * 0.3, c - r, c + i * r * 0.3, c + r, 1, hex(0x8a7048));
        pc.line(c - r, c + i * r * 0.3, c + r, c + i * r * 0.3, 1, hex(0x8a7048));
      }
      const mask = new PixelCanvas(S, S);
      mask.ellipse(c, c, r, r, 1);
      for (let i = 0; i < pc.data.length; i++) if (!mask.data[i]) pc.data[i] = 0;
      return pc;
    }
    case 'fire_zone':
      return drawFireZone(S, frame);
  }
  pc.outline(OUT);
  return pc;
}

function drawFireZone(S: number, frame: number): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const c = S / 2;
  pc.ellipse(c, c + S * 0.12, S * 0.46, S * 0.3, withAlpha(hex(0x8a1a10), 150));
  pc.ellipse(c, c + S * 0.12, S * 0.34, S * 0.2, withAlpha(hex(0xd8401a), 170));
  const tongues = [[-0.25, 0.7], [0, 1], [0.25, 0.8], [-0.1, 0.6], [0.12, 0.55]];
  tongues.forEach(([ox, h], i) => {
    const flick = ((frame + i) % 4) / 4;
    const x = c + ox * S;
    const top = c + S * 0.12 - S * 0.38 * h * (0.75 + flick * 0.35);
    const base = c + S * 0.18;
    const w = S * 0.09;
    pc.poly([[x - w, base], [x + w, base], [x + w * 0.3 * (i % 2 ? 1 : -1), top]], hex(0xff7a2a));
    pc.poly([[x - w * 0.5, base], [x + w * 0.5, base], [x, top + (base - top) * 0.4]], hex(0xffd04a));
  });
  return pc;
}

// ---------- pickups ----------

export function drawPickup(key: string, S: number, frame: number): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const c = (S - 1) / 2;
  if (key === 'gold') {
    const rx = frame % 2 ? S * 0.2 : S * 0.42;
    pc.ellipse(c + 0.5, c + 0.5, rx, S * 0.42, hex(0xf2c230));
    if (frame % 2 === 0) pc.ellipse(c + 0.5, c + 0.5, rx * 0.5, S * 0.22, hex(0xd89a18));
    pc.set(c - rx * 0.4 + 0.5, c - 1, hex(0xfff2b0));
    pc.outline(hex(0x6a4a10));
    return pc;
  }
  const color = key === 'gem_s' ? 0x4fd6a8 : key === 'gem_m' ? 0x3a9df0 : 0xd05cf0;
  const g = hex(color);
  pc.poly([[c + 0.5, 0], [S, c + 0.5], [c + 0.5, S], [0, c + 0.5]], g);
  pc.poly([[c + 0.5, 0], [S, c + 0.5], [c + 0.5, c + 0.5]], shade(g, 1.3));
  pc.poly([[0, c + 0.5], [c + 0.5, S], [c + 0.5, c + 0.5]], shade(g, 0.7));
  pc.set(c - 0.5, c - 1, hex(0xffffff));
  return pc;
}

// ---------- upgrade icons (16×16) ----------

/** 10×10 glyphs: '#' main colour, '+' highlight, 'o' dark detail. */
const GLYPHS: Record<string, string[]> = {
  swift_wings: ['..........', '.#........', '.##.......', '.###......', '.####.....', '..####....', '...####+..', '....####++', '.....###..', '..........'],
  thick_scales: ['..........', '..##..##..', '.#++##++#.', '.#..##..#.', '..##..##..', '.#++##++#.', '.#..##..#.', '..##..##..', '..........', '..........'],
  magnet: ['..........', '.##....##.', '.##....##.', '.##....##.', '.##....##.', '.##....##.', '.##+..+##.', '..######..', '...####...', '..........'],
  fury: ['......++..', '.....+##..', '....+##...', '...+##....', '..o##.....', '..oo......', '.oo.......', '.o........', '..........', '..........'],
  quick_breath: ['..........', '.####.....', '......###.', '..######..', '.........#', '.#######..', '......##..', '..####....', '..........', '..........'],
  regen: ['..........', '..##..##..', '.####.###.', '.##+#####.', '.########.', '..######..', '...####...', '....##....', '..........', '..........'],
  fire_orbit: ['...####...', '..#....#..', '.#......#.', '#...++...#', '#..++++..#', '#..++++..#', '#...++...#', '.#......#.', '..#....#..', '...####...'],
  ember_trail: ['..........', '......+...', '.....+#...', '..+..##...', '.+#..###..', '.##.####..', '.########.', '..######..', '..........', '..........'],
  wider_flames: ['..........', '...+..+...', '..+#..#+..', '.+##++##+.', '.########.', '##########', '.########.', '..........', '..........', '..........'],
  searing: ['....+.....', '...+#.....', '...##+....', '..+####...', '..#####+..', '.###++###.', '.##++++##.', '..######..', '...####...', '..........'],
  fire_burst: ['....#.....', '.#..#..#..', '..#.#.#...', '...+++....', '####+####.', '...+++....', '..#.#.#...', '.#..#..#..', '....#.....', '..........'],
  frost_shards: ['..........', '....+.....', '...+#+....', '..+###+...', '...###....', '...###....', '...###....', '....#.....', '..........', '..........'],
  deep_chill: ['....#.....', '.#..#..#..', '..#.#.#...', '...###....', '#########.', '...###....', '..#.#.#...', '.#..#..#..', '....#.....', '..........'],
  shatter: ['....#.....', '...###....', '..#+#.#...', '.##+..##..', '..#..+#...', '...#+#....', '....#.....', '..........', '..........', '..........'],
  ice_armor: ['..........', '.########.', '.#++++++#.', '.#+####+#.', '.#+####+#.', '..#+##+#..', '..#+##+#..', '...#++#...', '....##....', '..........'],
  frost_aura: ['..######..', '.#......#.', '#..####..#', '#.#....#.#', '#.#.++.#.#', '#.#.++.#.#', '#.#....#.#', '#..####..#', '.#......#.', '..######..'],
  thunder_strike: ['.....###..', '....###...', '...###....', '..######..', '....###...', '...###....', '..##......', '.#........', '..........', '..........'],
  extra_jump: ['.###......', '..##...+..', '.##...+++.', '..##...+..', '.##.......', '..##..###.', '.....###..', '....###...', '.....#....', '..........'],
  static_charge: ['..........', '#.........', '.#...#....', '..#.#.#...', '...#...#..', '........#.', '.........#', '..........', '..........', '..........'],
  overcharge: ['...####...', '..#....#..', '..#.##.#..', '..#.#..#..', '..#.###.#.', '..#..#.#..', '..#.##.#..', '..#....#..', '..######..', '..........'],
  spark_speed: ['......##..', '.....##...', '.###.##...', '....####..', '.####.##..', '.....##...', '.###.#....', '....#.....', '..........', '..........'],
};

export function drawIcon(id: string, color: number): PixelCanvas {
  const pc = new PixelCanvas(16, 16);
  const base = hex(color);
  pc.rect(1, 1, 14, 14, shade(base, 0.35));
  pc.rect(2, 2, 12, 12, shade(base, 0.5));
  const glyph = GLYPHS[id] ?? GLYPHS.fury;
  glyph.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const c: Color | 0 = ch === '#' ? mix(base, hex(0xffffff), 0.35) : ch === '+' ? hex(0xffffff) : ch === 'o' ? shade(base, 0.25) : 0;
      if (c) pc.set(3 + x, 3 + y, c);
    }
  });
  pc.outline(OUT);
  return pc;
}

// ---------- ground ----------

/** Deterministic integer hash noise in [0,1). */
export function noise(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function drawGround(S: number): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const a = hex(0x3d6b3a), b = hex(0x46783f), d = hex(0x355f33), l = hex(0x5a8f4a);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const n = noise(x >> 1, y >> 1, 3);
    pc.set(x, y, n < 0.45 ? a : n < 0.85 ? b : d);
  }
  // grass blades
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(noise(i, 1, 9) * S), y = Math.floor(noise(i, 2, 9) * S);
    pc.set(x, y, l); pc.set(x, (y + S - 1) % S, l); pc.set((x + 1) % S, (y + S - 2) % S, l);
  }
  return pc;
}

/** Ground decorations: 0 tuft, 1 red flower, 2 yellow flower, 3 stone, 4 mushroom, 5 bush. 16×16 each. */
export const DECOR_FRAMES = 6;
export function drawDecor(frame: number): PixelCanvas {
  const pc = new PixelCanvas(16, 16);
  const stemG = hex(0x2e5a2c);
  switch (frame) {
    case 0:
      for (const [x, h] of [[5, 5], [7, 7], [9, 6], [11, 4]]) pc.line(x, 14, x + (x > 8 ? 1 : -1), 14 - h, 1, hex(0x6fa85a));
      break;
    case 1:
    case 2: {
      const petal = hex(frame === 1 ? 0xe8524a : 0xf2d04a);
      pc.line(8, 14, 8, 9, 1, stemG);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pc.set(8 + dx, 8 + dy, petal);
      pc.set(8, 8, hex(0xfff2c0));
      pc.set(6, 12, hex(0x5a9a4a)); pc.set(7, 11, hex(0x5a9a4a));
      break;
    }
    case 3:
      pc.ellipse(8, 12, 4, 2.6, (_dx, dy) => shade(hex(0x8a8f98), 1.1 - dy * 0.35));
      pc.ellipse(11, 13, 2, 1.4, hex(0x767b84));
      break;
    case 4:
      pc.rect(7, 10, 2, 4, hex(0xf0e6d0));
      pc.ellipse(8, 9, 3.5, 2.2, hex(0xc8402a));
      pc.set(7, 8, hex(0xffffff)); pc.set(9, 9, hex(0xffffff));
      break;
    case 5:
      pc.ellipse(8, 10, 6, 4.5, (_dx, dy) => shade(hex(0x3f7a38), 1.15 - dy * 0.4));
      pc.set(6, 8, hex(0x6fae5a)); pc.set(10, 9, hex(0x6fae5a));
      break;
  }
  pc.outline(withAlpha(hex(0x1e3a1e), 255));
  return pc;
}

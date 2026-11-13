import { hex, PixelCanvas, shade, withAlpha, type Color } from './pixel';

export type KnightKind = 'squire' | 'archer' | 'lancer' | 'netter' | 'heavy' | 'cleric' | 'boss';

interface Gear {
  tunic: number; armor: number; skin: number; helm: 'helmet' | 'hood' | 'cap' | 'great' | 'horned' | 'crown';
  helmColor: number; plume?: number; bulk: number;
}

const GEAR: Record<KnightKind, Gear> = {
  squire: { tunic: 0x3a6fd0, armor: 0xb8c0c8, skin: 0xf0c49a, helm: 'helmet', helmColor: 0xaab4bf, bulk: 1 },
  archer: { tunic: 0x3f7a35, armor: 0x7a5a36, skin: 0xe8b88c, helm: 'hood', helmColor: 0x2f6a2a, bulk: 0.95 },
  lancer: { tunic: 0xb0302a, armor: 0xc8ccd2, skin: 0xf0c49a, helm: 'great', helmColor: 0xc0c6cc, plume: 0xe8402a, bulk: 1 },
  netter: { tunic: 0x8a6a3a, armor: 0x6b4f2a, skin: 0xd9a77a, helm: 'cap', helmColor: 0x5a3f20, bulk: 1 },
  heavy: { tunic: 0x4a4f5c, armor: 0x8890a0, skin: 0xe0b08a, helm: 'horned', helmColor: 0x6a7282, bulk: 1.25 },
  cleric: { tunic: 0xf2ecd8, armor: 0xd8b04a, skin: 0xf0c49a, helm: 'hood', helmColor: 0xe8e0c8, bulk: 0.95 },
  boss: { tunic: 0x6e1622, armor: 0x9aa2b0, skin: 0xe0b08a, helm: 'crown', helmColor: 0x8a929e, plume: 0xd8b04a, bulk: 1.15 },
};

/** Draws a walking dragon-hunter facing right; 4-frame walk cycle. */
export function drawKnight(S: number, frame: number, kind: KnightKind): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const g = GEAR[kind];
  const u = S / 24;
  const step = [0, 1, 0, -1][frame % 4];
  const bob = frame % 2 === 1 ? -u * 0.6 : 0;
  const cx = S * 0.48;
  const tunic = hex(g.tunic), armor = hex(g.armor), skin = hex(g.skin), helm = hex(g.helmColor);
  const bodyW = S * 0.3 * g.bulk, bodyH = S * 0.28;
  const hipY = S * 0.7 + bob, shoulderY = hipY - bodyH;
  const legW = Math.max(2, S * 0.1 * g.bulk), legH = S * 0.2;

  // cape behind (boss) or quiver (archer)
  if (kind === 'boss') pc.poly([[cx - bodyW * 0.5, shoulderY], [cx + bodyW * 0.2, shoulderY], [cx - bodyW * 0.2 - step * u, S * 0.88], [cx - bodyW * 0.95 - step * u, S * 0.86]], hex(0x8a1f2c));
  if (kind === 'archer') pc.rect(cx - bodyW * 0.75, shoulderY - 1 * u, 3 * u, bodyH * 0.8, hex(0x6b4a2a));

  // legs (back leg darker)
  pc.rect(cx - legW - step * u * 1.2, hipY - 1, legW, legH, shade(tunic, 0.6));
  pc.rect(cx + step * u * 1.2, hipY - 1, legW, legH, shade(tunic, 0.8));
  pc.rect(cx - legW - step * u * 1.2, hipY + legH - 2 * u, legW + u, 2 * u, hex(0x3a2a20));
  pc.rect(cx + step * u * 1.2, hipY + legH - 2 * u, legW + u, 2 * u, hex(0x3a2a20));

  // torso: tunic with armour plate and belt
  pc.rect(cx - bodyW / 2, shoulderY, bodyW, bodyH, tunic);
  if (kind !== 'archer' && kind !== 'cleric' && kind !== 'netter') pc.rect(cx - bodyW / 2 + u, shoulderY + u, bodyW - 2 * u, bodyH * 0.55, armor);
  pc.rect(cx - bodyW / 2, hipY - 2 * u, bodyW, Math.max(1, 1.5 * u), hex(0x4a3020));
  if (kind === 'cleric') pc.rect(cx - u * 0.6, shoulderY + u, Math.max(1, 1.2 * u), bodyH - 3 * u, hex(0xd8b04a));

  // head
  const headR = S * 0.13;
  const headY = shoulderY - headR * 0.9;
  pc.ellipse(cx + u * 0.5, headY, headR, headR, skin);
  drawHelm(pc, g, cx + u * 0.5, headY, headR, u, helm);

  // gear in hands
  const handX = cx + bodyW * 0.45, handY = shoulderY + bodyH * 0.45;
  drawGear(pc, kind, S, u, handX, handY, frame, cx, shoulderY, bodyW);

  pc.outline(withAlpha(hex(0x15131c), 255));

  // eye
  if (g.helm !== 'great' && g.helm !== 'horned' && g.helm !== 'crown') pc.set(cx + u * 0.5 + headR * 0.45, headY, hex(0x15131c));

  // ground shadow
  const sh = withAlpha(hex(0x000000), 70);
  const sy = S * 0.95;
  for (let y = Math.floor(sy - S * 0.04); y <= sy + S * 0.03; y++) {
    for (let x = Math.floor(cx - S * 0.25); x <= cx + S * 0.25; x++) {
      const dx = (x - cx) / (S * 0.24), dy = (y - sy) / (S * 0.04);
      if (dx * dx + dy * dy <= 1) pc.under(x, y, sh);
    }
  }
  return pc;
}

function drawHelm(pc: PixelCanvas, g: Gear, hx: number, hy: number, r: number, u: number, c: Color): void {
  switch (g.helm) {
    case 'helmet':
      pc.ellipse(hx, hy - r * 0.35, r * 1.05, r * 0.75, c);
      pc.rect(hx - r, hy - r * 0.2, r * 2, Math.max(1, u), shade(c, 0.75));
      break;
    case 'hood':
      pc.ellipse(hx - r * 0.2, hy - r * 0.1, r * 1.15, r * 1.1, c);
      pc.ellipse(hx + r * 0.35, hy + r * 0.1, r * 0.6, r * 0.6, hex(g.skin));
      break;
    case 'cap':
      pc.ellipse(hx, hy - r * 0.5, r * 1.05, r * 0.6, c);
      pc.rect(hx, hy - r * 0.35, r * 1.3, Math.max(1, u), shade(c, 0.8));
      break;
    case 'great':
    case 'horned':
    case 'crown':
      pc.ellipse(hx, hy - r * 0.05, r * 1.1, r * 1.1, c);
      pc.rect(hx + r * 0.1, hy - r * 0.15, r * 0.9, Math.max(1, u), hex(0x15131c));
      if (g.helm === 'horned') {
        pc.line(hx - r * 0.7, hy - r * 0.6, hx - r * 1.4, hy - r * 1.6, Math.max(1, 1.4 * u), hex(0xf0e6d0));
        pc.line(hx + r * 0.7, hy - r * 0.6, hx + r * 1.3, hy - r * 1.6, Math.max(1, 1.4 * u), hex(0xf0e6d0));
      }
      if (g.plume !== undefined && g.helm === 'great') pc.line(hx, hy - r, hx - r * 1.4, hy - r * 1.5, Math.max(1, 1.8 * u), hex(g.plume));
      if (g.helm === 'crown') {
        for (let i = -1; i <= 1; i++) pc.poly([[hx + i * r * 0.6 - r * 0.3, hy - r], [hx + i * r * 0.6 + r * 0.3, hy - r], [hx + i * r * 0.6, hy - r * 1.7]], hex(0xd8b04a));
      }
      break;
  }
}

function drawGear(pc: PixelCanvas, kind: KnightKind, S: number, u: number, hx: number, hy: number, frame: number, cx: number, shoulderY: number, bodyW: number): void {
  const steel = hex(0xdfe4ea), wood = hex(0x7a5230), gold = hex(0xd8b04a);
  switch (kind) {
    case 'squire':
      pc.line(hx, hy, hx + S * 0.18, hy - S * 0.2, Math.max(1, 1.2 * u), steel);
      pc.rect(hx - u, hy - u, 3 * u, Math.max(1, u), gold);
      pc.ellipse(cx - bodyW * 0.15, shoulderY + S * 0.13, S * 0.1, S * 0.12, hex(0x8a5a2a));
      pc.ellipse(cx - bodyW * 0.15, shoulderY + S * 0.13, S * 0.04, S * 0.05, gold);
      break;
    case 'archer': {
      const bx = hx + S * 0.08;
      for (let a = -1.2; a <= 1.2; a += 0.1) pc.set(bx + Math.cos(a) * S * 0.08, hy + Math.sin(a) * S * 0.22, wood);
      pc.line(bx, hy - S * 0.21, bx, hy + S * 0.21, 1, hex(0xe8e0c8));
      break;
    }
    case 'lancer':
      pc.line(hx - S * 0.25, hy + S * 0.02, S - 1, hy - S * 0.03, Math.max(1, 1.6 * u), wood);
      pc.poly([[S - 1, hy - S * 0.03], [S - 4 * u, hy - S * 0.03 - 2 * u], [S - 4 * u, hy - S * 0.03 + 2 * u]], steel);
      pc.poly([[hx - S * 0.05, hy - S * 0.05], [hx + S * 0.1, hy - S * 0.03], [hx - S * 0.05, hy + S * 0.08]], hex(0xe8402a));
      break;
    case 'netter': {
      const nx = hx + S * 0.1, ny = hy - S * 0.05, r = S * 0.13;
      pc.ellipse(nx, ny, r, r, withAlpha(hex(0xc8b490), 200));
      for (let i = -2; i <= 2; i++) {
        pc.line(nx + i * r * 0.4, ny - r, nx + i * r * 0.4, ny + r, 1, hex(0x7a6440));
        pc.line(nx - r, ny + i * r * 0.4, nx + r, ny + i * r * 0.4, 1, hex(0x7a6440));
      }
      break;
    }
    case 'heavy':
      pc.rect(hx - S * 0.02, hy - S * 0.2, S * 0.16, S * 0.38, hex(0x6a7282));
      pc.rect(hx + S * 0.01, hy - S * 0.17, S * 0.1, S * 0.32, hex(0x9aa2b0));
      pc.rect(hx + S * 0.05, hy - S * 0.1, Math.max(1, u), S * 0.18, gold);
      break;
    case 'cleric':
      pc.line(hx + S * 0.05, hy - S * 0.32, hx + S * 0.05, hy + S * 0.22, Math.max(1, 1.2 * u), wood);
      pc.ellipse(hx + S * 0.05, hy - S * 0.34, S * 0.06, S * 0.06, hex(frame % 2 ? 0xfff6a8 : 0xffe066));
      break;
    case 'boss':
      pc.line(hx, hy + S * 0.05, hx + S * 0.3, hy - S * 0.3, Math.max(2, 2.4 * u), steel);
      pc.line(hx - S * 0.04, hy + S * 0.02, hx + S * 0.06, hy + S * 0.1, Math.max(1, 1.6 * u), gold);
      break;
  }
}

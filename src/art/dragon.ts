import type { FormId } from '../logic/types';
import { hex, mix, PixelCanvas, shade, withAlpha, type Color } from './pixel';

interface DragonLook {
  body: number; belly: number; wing: number; membrane: number; horn: number; accent: number; eye: number;
  stage: 0 | 1 | 2 | 3; element: 'none' | 'fire' | 'ice' | 'lightning';
}

const LOOKS: Record<'none' | 'fire' | 'ice' | 'lightning', Omit<DragonLook, 'stage' | 'element'>> = {
  none: { body: 0x6fcf5a, belly: 0xf1e7a8, wing: 0x3f8f3a, membrane: 0x9fe08a, horn: 0xf5ead0, accent: 0xffd36b, eye: 0x1b2b1b },
  fire: { body: 0xd9452b, belly: 0xf7c04a, wing: 0x7a1f22, membrane: 0xf07a3a, horn: 0x3a2020, accent: 0xffd34a, eye: 0xfff1a8 },
  ice: { body: 0x58b4e6, belly: 0xeaf8ff, wing: 0x2b6aa8, membrane: 0xb2e9ff, horn: 0xffffff, accent: 0xd6f6ff, eye: 0x0e2a4a },
  lightning: { body: 0x5b3d91, belly: 0xf5d742, wing: 0x2a1c52, membrane: 0x9a74e0, horn: 0xf5d742, accent: 0xfff27a, eye: 0xfff27a },
};

/** Wing angle per frame of the 6-frame flight cycle (radians, negative = raised). */
const WING = [-1.0, -0.55, -0.05, 0.35, 0.0, -0.55];
const BOB = [1, 0.5, 0, -0.5, 0, 0.5];

export function lookFor(id: FormId): DragonLook {
  if (id === 'hatchling') return { ...LOOKS.none, stage: 0, element: 'none' };
  const [stage, element] = id.split('_') as ['young' | 'adult' | 'legendary', 'fire' | 'ice' | 'lightning'];
  return { ...LOOKS[element], stage: stage === 'young' ? 1 : stage === 'adult' ? 2 : 3, element };
}

/** Draws one 6-frame flight cycle frame of a dragon facing right into an S×S canvas. */
export function drawDragon(S: number, frame: number, look: DragonLook): PixelCanvas {
  const pc = new PixelCanvas(S, S);
  const u = S / 24; // design unit: the hatchling is 24 px
  const st = look.stage;
  const bob = BOB[frame % 6] * u;
  const wingA = WING[frame % 6];
  const body = hex(look.body), belly = hex(look.belly), wing = hex(look.wing), membrane = hex(look.membrane);
  const horn = hex(look.horn), accent = hex(look.accent);
  const shaded = (c: Color) => (dx: number, dy: number) => shade(c, 1.12 - dy * 0.32 - dx * 0.05);

  const bodyCx = S * 0.44, bodyCy = S * 0.6 + bob;
  const bodyRx = S * (st === 0 ? 0.2 : 0.22), bodyRy = S * (st === 0 ? 0.17 : 0.15);
  const headCx = S * (st === 0 ? 0.66 : 0.7), headCy = S * (st === 0 ? 0.42 : 0.37) + bob;
  const headR = S * (st === 0 ? 0.15 : 0.11);

  // far wing (behind the body), darker
  drawWing(pc, S, u, st, bodyCx - S * 0.02, bodyCy - bodyRy * 0.7, wingA + 0.35, shade(wing, 0.7), shade(membrane, 0.75), 0.85);

  // tail: tapering curve from the back of the body
  const tailSway = Math.sin((frame / 6) * Math.PI * 2) * u;
  const tailLen = st === 0 ? 0.3 : 0.38;
  let px = bodyCx - bodyRx * 0.8, py = bodyCy + bodyRy * 0.2;
  const segs = 6;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const nx = bodyCx - bodyRx * 0.8 - S * tailLen * t;
    const ny = bodyCy + bodyRy * 0.2 - S * 0.16 * t * t + tailSway * t;
    pc.line(px, py, nx, ny, Math.max(1, (st === 0 ? 4 : 5) * u * (1 - t * 0.75)), body);
    px = nx; py = ny;
  }
  drawTailTip(pc, px, py, u, look);

  // legs
  const legY = bodyCy + bodyRy * 0.75;
  pc.rect(bodyCx - bodyRx * 0.45, legY, Math.max(2, 2.2 * u), Math.max(2, 2.5 * u), shade(body, 0.8));
  pc.rect(bodyCx + bodyRx * 0.3, legY, Math.max(2, 2.2 * u), Math.max(2, 2.5 * u), shade(body, 0.9));

  // body + belly
  pc.ellipse(bodyCx, bodyCy, bodyRx, bodyRy, shaded(body));
  pc.ellipse(bodyCx + bodyRx * 0.25, bodyCy + bodyRy * 0.35, bodyRx * 0.62, bodyRy * 0.55, shaded(belly));

  // back spikes (adult and legendary)
  if (st >= 2) {
    const n = st === 3 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const sx = bodyCx - bodyRx * 0.6 + bodyRx * 1.0 * t;
      const sy = bodyCy - bodyRy * 0.85 - Math.sin(t * Math.PI) * u;
      pc.poly([[sx - 1.4 * u, sy + 1.5 * u], [sx + 1.4 * u, sy + 1.5 * u], [sx, sy - 2.2 * u]], accent);
    }
  }

  // neck
  pc.line(bodyCx + bodyRx * 0.55, bodyCy - bodyRy * 0.3, headCx - headR * 0.3, headCy + headR * 0.3, Math.max(2, (st === 0 ? 5 : 4.5) * u), body);

  // head + snout
  pc.ellipse(headCx, headCy, headR, headR * 0.92, shaded(body));
  const snoutX = headCx + headR * (st === 0 ? 0.75 : 0.95), snoutY = headCy + headR * 0.3;
  pc.ellipse(snoutX, snoutY, headR * (st === 0 ? 0.5 : 0.7), headR * 0.45, shaded(shade(body, 1.05)));
  pc.set(snoutX + headR * 0.45, snoutY - headR * 0.15, shade(body, 0.5)); // nostril

  // horns
  const hornLen = [1.6, 3.2, 4.2, 5.2][st] * u;
  pc.line(headCx - headR * 0.2, headCy - headR * 0.6, headCx - headR * 0.2 - hornLen, headCy - headR * 0.6 - hornLen * 0.7, Math.max(1, 1.6 * u), horn);
  if (st >= 1) pc.line(headCx + headR * 0.2, headCy - headR * 0.7, headCx + headR * 0.05 - hornLen * 0.6, headCy - headR * 0.7 - hornLen * 0.85, Math.max(1, 1.3 * u), shade(horn, 0.85));
  if (st === 3) drawCrown(pc, headCx, headCy - headR, u, look);

  // near wing (in front of the body)
  drawWing(pc, S, u, st, bodyCx + S * 0.02, bodyCy - bodyRy * 0.6, wingA, wing, membrane, 1);

  pc.outline(withAlpha(shade(hex(look.body), 0.28), 255));

  // eye, drawn after the outline so it stays crisp
  const ex = headCx + headR * 0.25, ey = headCy - headR * 0.15;
  const eyeR = Math.max(1, (st === 0 ? 2.2 : 1.6) * u);
  pc.ellipse(ex, ey, eyeR, eyeR, hex(0xffffff));
  pc.set(ex + eyeR * 0.4, ey, hex(look.eye === 0xfff27a || look.eye === 0xfff1a8 ? 0x201010 : look.eye));
  if (eyeR > 1.5) pc.set(ex + eyeR * 0.4, ey + 1, hex(0x201010));
  if (look.element === 'lightning' || look.element === 'fire') pc.set(ex - eyeR * 0.5, ey - eyeR * 0.5, hex(look.eye));

  // soft ground shadow, only where nothing else is drawn
  const sh = withAlpha(hex(0x000000), 70);
  const shadowY = S * 0.93;
  for (let y = Math.floor(shadowY - S * 0.04); y <= shadowY + S * 0.04; y++) {
    for (let x = Math.floor(S * 0.2); x <= S * 0.75; x++) {
      const dx = (x - S * 0.47) / (S * 0.27), dy = (y - shadowY) / (S * 0.045);
      if (dx * dx + dy * dy <= 1) pc.under(x, y, sh);
    }
  }
  return pc;
}

function drawWing(pc: PixelCanvas, S: number, u: number, st: number, rootX: number, rootY: number, angle: number, bone: Color, membrane: Color, scale: number): void {
  const len = S * [0.26, 0.4, 0.46, 0.5][st] * scale;
  // wing points up-back; angle rotates it (negative raises the tip)
  const dir = -Math.PI / 2 - 0.55 + angle;
  const tipX = rootX + Math.cos(dir) * len, tipY = rootY + Math.sin(dir) * len;
  const backX = rootX - len * 0.75, backY = rootY + len * 0.05 + angle * len * 0.25;
  if (st === 0) {
    pc.poly([[rootX, rootY], [tipX, tipY], [backX + len * 0.3, backY]], membrane);
    pc.line(rootX, rootY, tipX, tipY, Math.max(1, 1.4 * u), bone);
    return;
  }
  // membrane with scalloped fingers
  const fingers = 3;
  const pts: [number, number][] = [[rootX, rootY], [tipX, tipY]];
  for (let i = 1; i <= fingers; i++) {
    const t = i / fingers;
    const fx = tipX + (backX - tipX) * t, fy = tipY + (backY - tipY) * t;
    const midX = (tipX + (backX - tipX) * (t - 0.5 / fingers) + rootX) / 2, midY = (tipY + (backY - tipY) * (t - 0.5 / fingers) + rootY) / 2;
    pts.push([midX + (fx - rootX) * 0.25, midY + (fy - rootY) * 0.25]);
    pts.push([fx, fy]);
  }
  pc.poly(pts, membrane);
  pc.line(rootX, rootY, tipX, tipY, Math.max(1, 1.6 * u), bone);
  for (let i = 1; i <= fingers; i++) {
    const t = i / fingers;
    pc.line(tipX, tipY, tipX + (backX - tipX) * t, tipY + (backY - tipY) * t, Math.max(1, 0.9 * u), mix(bone, membrane, 0.3));
  }
  pc.set(tipX, tipY - 1, bone);
}

function drawTailTip(pc: PixelCanvas, x: number, y: number, u: number, look: DragonLook): void {
  const a = hex(look.accent);
  if (look.element === 'fire') {
    pc.poly([[x - 2.5 * u, y + 1.5 * u], [x + 1.5 * u, y + 1.5 * u], [x - 1 * u, y - 4 * u]], hex(0xff8a2a));
    pc.poly([[x - 1.5 * u, y + 1 * u], [x + 0.5 * u, y + 1 * u], [x - 0.7 * u, y - 2 * u]], a);
  } else if (look.element === 'ice') {
    pc.poly([[x, y - 3 * u], [x + 1.6 * u, y], [x, y + 3 * u], [x - 1.6 * u, y]], a);
  } else if (look.element === 'lightning') {
    pc.poly([[x - 2 * u, y - 3 * u], [x + 0.5 * u, y - 0.5 * u], [x - 1 * u, y - 0.2 * u], [x + 1.5 * u, y + 3 * u], [x - 1 * u, y + 0.5 * u], [x, y]], a);
  } else {
    pc.poly([[x - 2 * u, y], [x, y - 1.6 * u], [x + 1 * u, y + 0.8 * u]], shade(hex(look.body), 0.8));
  }
}

function drawCrown(pc: PixelCanvas, cx: number, top: number, u: number, look: DragonLook): void {
  const c = hex(look.element === 'lightning' ? 0xffffff : 0xffd34a);
  for (let i = -1; i <= 1; i++) pc.poly([[cx + i * 2.2 * u - 1.1 * u, top], [cx + i * 2.2 * u + 1.1 * u, top], [cx + i * 2.2 * u, top - 2.6 * u]], c);
  pc.rect(cx - 3.3 * u, top - 0.6 * u, 6.6 * u, Math.max(1, 1.2 * u), c);
}

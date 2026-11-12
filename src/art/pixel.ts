/**
 * Tiny pixel-art canvas that works without the DOM (so it can be unit-tested).
 * Colours are packed 32-bit ints in ImageData byte order (R, G, B, A); 0 means transparent.
 */
export type Color = number;

export function rgb(r: number, g: number, b: number, a = 255): Color {
  return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function hex(h: number, a = 255): Color {
  return rgb((h >> 16) & 0xff, (h >> 8) & 0xff, h & 0xff, a);
}

const ch = (c: Color, shift: number) => (c >>> shift) & 0xff;

export function mix(a: Color, b: Color, t: number): Color {
  const m = (s: number) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return rgb(m(0), m(8), m(16), m(24));
}

export function shade(c: Color, f: number): Color {
  return f >= 1 ? mix(c, rgb(255, 255, 255, ch(c, 24)), Math.min(1, f - 1)) : mix(rgb(0, 0, 0, ch(c, 24)), c, Math.max(0, f));
}

export function withAlpha(c: Color, a: number): Color {
  return rgb(ch(c, 0), ch(c, 8), ch(c, 16), a);
}

export class PixelCanvas {
  readonly data: Uint32Array;

  constructor(readonly width: number, readonly height: number) {
    this.data = new Uint32Array(width * height);
  }

  get(x: number, y: number): Color {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.data[y * this.width + x];
  }

  set(x: number, y: number, c: Color): void {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.data[y * this.width + x] = c;
  }

  /** Writes only where the canvas is still transparent. */
  under(x: number, y: number, c: Color): void {
    if (this.get(x, y) === 0) this.set(x, y, c);
  }

  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let j = Math.floor(y); j < y + h; j++) for (let i = Math.floor(x); i < x + w; i++) this.set(i, j, c);
  }

  /** Filled ellipse; `paint` can vary the colour by normalized offset (dx, dy in -1..1) for simple shading. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color | ((dx: number, dy: number) => Color)): void {
    if (rx <= 0 || ry <= 0) return;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === 'number' ? c : c(dx, dy));
      }
    }
  }

  /** Thick line between two points (round brush). */
  line(x0: number, y0: number, x1: number, y1: number, width: number, c: Color): void {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    const r = width / 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (r <= 0.6) this.set(x, y, c);
      else this.ellipse(x, y, r, r, c);
    }
  }

  /** Filled polygon (even-odd scanline). */
  poly(points: readonly (readonly [number, number])[], c: Color): void {
    const ys = points.map((p) => p[1]);
    const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
    for (let y = minY; y <= maxY; y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [ax, ay] = points[i], [bx, by] = points[(i + 1) % points.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
      }
    }
  }

  /** Adds a 1px outline around every opaque pixel (4-neighbourhood). */
  outline(c: Color): void {
    const src = this.data.slice();
    const w = this.width, h = this.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] !== 0) continue;
        const n = (x > 0 && src[y * w + x - 1]) || (x < w - 1 && src[y * w + x + 1]) || (y > 0 && src[(y - 1) * w + x]) || (y < h - 1 && src[(y + 1) * w + x]);
        if (n) this.data[y * w + x] = c;
      }
    }
  }

  blit(src: PixelCanvas, ox: number, oy: number): void {
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      const c = src.data[y * src.width + x];
      if (c !== 0) this.set(ox + x, oy + y, c);
    }
  }

  crop(x: number, y: number, w: number, h: number): PixelCanvas {
    const out = new PixelCanvas(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.data[j * w + i] = this.get(x + i, y + j);
    return out;
  }

  flipX(): PixelCanvas {
    const out = new PixelCanvas(this.width, this.height);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) out.data[y * this.width + x] = this.data[y * this.width + (this.width - 1 - x)];
    return out;
  }

  opaqueCount(): number {
    let n = 0;
    for (const c of this.data) if (c !== 0) n++;
    return n;
  }

  hash(): number {
    let h = 2166136261;
    for (const c of this.data) { h ^= c; h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /** RGBA bytes ready for `new ImageData(...)`. */
  bytes(): Uint8ClampedArray {
    return new Uint8ClampedArray(this.data.buffer.slice(0));
  }
}

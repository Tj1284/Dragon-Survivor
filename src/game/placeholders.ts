import type * as Phaser from 'phaser';
import type { SheetDef } from '../assets/manifest';

function shade(color: number, factor: number): string {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((color & 0xff) * factor));
  return `rgb(${r},${g},${b})`;
}

/** Builds a texture `def.key` with `def.frames` numbered frames: rounded block, darker outline, white "eye" on the right. */
export function makePlaceholder(scene: Phaser.Scene, def: SheetDef): void {
  const { frameWidth: w, frameHeight: h, frames } = def;
  const tex = scene.textures.createCanvas(def.key, w * frames, h);
  if (!tex) return;
  const ctx = tex.getContext();
  if (def.key === 'ground') {
    // seamless tile: flat fill with a few darker specks
    ctx.fillStyle = shade(def.color, 1);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(def.color, 0.8);
    for (const [sx, sy] of [[3, 5], [17, 9], [9, 22], [26, 27], [22, 3]]) ctx.fillRect(sx, sy, 2, 1);
    tex.add(0, 0, 0, 0, w, h);
    tex.refresh();
    return;
  }
  const pad = Math.max(1, Math.floor(w / 8));
  for (let i = 0; i < frames; i++) {
    const x0 = i * w;
    const bob = frames > 1 && i % 2 === 1 ? 1 : 0;
    ctx.fillStyle = shade(def.color, 0.55);
    ctx.fillRect(x0 + pad, pad + bob, w - 2 * pad, h - 2 * pad);
    ctx.fillStyle = shade(def.color, 0.9 + 0.12 * (i % 3));
    ctx.fillRect(x0 + pad + 1, pad + 1 + bob, w - 2 * pad - 2, h - 2 * pad - 2);
    if (w >= 12) {
      const eye = Math.max(1, Math.floor(w / 10));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x0 + w - pad - 2 * eye - 1, Math.floor(h / 3) + bob, eye * 2, eye * 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x0 + w - pad - eye - 1, Math.floor(h / 3) + bob + eye / 2, eye, eye);
    }
    tex.add(i, 0, x0, 0, w, h);
  }
  tex.refresh();
}

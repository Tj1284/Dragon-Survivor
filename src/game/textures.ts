import type * as Phaser from 'phaser';
import type { PixelCanvas } from '../art/pixel';

/** Uploads a PixelCanvas as a spritesheet texture with numbered frames. */
export function addPixelTexture(scene: Phaser.Scene, key: string, pc: PixelCanvas, frameWidth: number, frameHeight: number): void {
  const tex = scene.textures.createCanvas(key, pc.width, pc.height);
  if (!tex) return;
  tex.getContext().putImageData(new ImageData(pc.bytes() as Uint8ClampedArray<ArrayBuffer>, pc.width, pc.height), 0, 0);
  const frames = Math.floor(pc.width / frameWidth);
  for (let i = 0; i < frames; i++) tex.add(i, 0, i * frameWidth, 0, frameWidth, frameHeight);
  tex.refresh();
}

/** Soft radial glow (white, alpha falloff) used for auras and light. */
export function addGlowTexture(scene: Phaser.Scene, key: string, size: number): void {
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

/** Screen vignette: transparent centre, dark edges. */
export function addVignetteTexture(scene: Phaser.Scene, key: string, size: number): void {
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.72);
  g.addColorStop(0, 'rgba(10,8,20,0)');
  g.addColorStop(1, 'rgba(10,8,20,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

/** 2×2 white pixel for particles. */
export function addPixel(scene: Phaser.Scene, key: string): void {
  const tex = scene.textures.createCanvas(key, 2, 2);
  if (!tex) return;
  tex.getContext().fillStyle = '#ffffff';
  tex.getContext().fillRect(0, 0, 2, 2);
  tex.refresh();
}

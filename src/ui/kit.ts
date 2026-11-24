import * as Phaser from 'phaser';
import { GROUND, ICON, UI } from '../assets/manifest';

/** The interface art (art/ui) is optional at runtime: without it every helper falls back to plain shapes. */
export function hasUi(scene: Phaser.Scene): boolean {
  return scene.textures.exists(UI.button.key) && scene.textures.exists(UI.panel.key);
}

/** The button art is grey with its body at ~78% brightness: brighten the colour so the tinted body matches it. */
export function buttonTint(color: number): number {
  const ch = (shift: number) => Math.min(255, Math.round(((color >> shift) & 0xff) / 0.78));
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** A stretchable stone panel with a gold border. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 1): Phaser.GameObjects.GameObject & { setDepth(d: number): unknown } {
  if (scene.textures.exists(UI.panel.key)) return scene.add.nineslice(x, y, UI.panel.key, 0, w, h, 10, 10, 10, 10).setAlpha(alpha);
  return scene.add.rectangle(x, y, w, h, 0x2a2638, alpha).setStrokeStyle(2, 0xf2c230);
}

/** A 16×16 interface icon, or nothing when the art is missing. */
export function icon(scene: Phaser.Scene, x: number, y: number, name: keyof typeof ICON, scale = 1): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(UI.icons.key)) return null;
  return scene.add.image(x, y, UI.icons.key, ICON[name]).setScale(scale);
}

/**
 * The night-castle background, scaled to cover the screen. `anchorX` picks which part stays visible when the
 * screen is narrower than the art (1 keeps the castle on the right). Falls back to the meadow tiles.
 */
export function background(scene: Phaser.Scene, anchorX = 0.5, dim = 0): void {
  const { width: w, height: h } = scene.scale.gameSize;
  if (scene.textures.exists(UI.bg.key)) {
    const s = Math.max(w / UI.bg.frameWidth, h / UI.bg.frameHeight);
    const bw = UI.bg.frameWidth * s;
    scene.add.image(-(bw - w) * anchorX, 0, UI.bg.key).setOrigin(0).setScale(s);
  } else {
    scene.add.tileSprite(0, 0, w, h, GROUND.key).setOrigin(0);
  }
  if (dim > 0) scene.add.rectangle(0, 0, w, h, 0x0e0c18, dim).setOrigin(0);
}

/** Twinkling stars over the top of the screen. */
export function stars(scene: Phaser.Scene, count: number, maxY: number): void {
  const { width: w } = scene.scale.gameSize;
  for (let i = 0; i < count; i++) {
    const star = scene.add.rectangle(Math.random() * w, 4 + Math.random() * maxY, 1, 1, 0xffffff, 0.2);
    scene.tweens.add({ targets: star, alpha: 1, duration: 600 + Math.random() * 900, yoyo: true, repeat: -1, delay: Math.random() * 1500 });
  }
}

/**
 * Pops objects in one group after another (fade + small scale bounce). They never move, so a quick tap
 * still lands on the button it aims at.
 */
export function enter(scene: Phaser.Scene, groups: Phaser.GameObjects.Components.Transform[][], startIndex = 0): void {
  groups.forEach((objs, gi) => {
    const i = gi + startIndex;
    for (const o of objs) {
      const sx = o.scaleX, sy = o.scaleY;
      o.setScale(sx * 0.85, sy * 0.85);
      // not 0: Phaser ignores taps on fully transparent objects, and a quick player shouldn't miss
      (o as unknown as Phaser.GameObjects.Components.AlphaSingle).setAlpha?.(0.02);
      scene.tweens.add({ targets: o, scaleX: sx, scaleY: sy, alpha: 1, duration: 240, delay: 60 + i * 70, ease: 'Back.Out' });
    }
  });
}

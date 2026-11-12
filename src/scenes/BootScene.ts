import * as Phaser from 'phaser';
import { ALL_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { DECOR_KEY, renderDecor, renderSheet } from '../art';
import { addGlowTexture, addPixel, addPixelTexture, addVignetteTexture } from '../game/textures';

/** Art the user has dropped into /art, discovered at build time (missing files are never requested). */
const ART = import.meta.glob('/art/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const placeholderKeys = new Set<string>();

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    for (const def of ALL_SHEETS) {
      const url = ART['/' + def.path];
      if (url) this.load.spritesheet(def.key, url, { frameWidth: def.frameWidth, frameHeight: def.frameHeight });
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => console.warn('art failed to load', file.key));
  }

  create(): void {
    for (const def of ALL_SHEETS) {
      if (!this.textures.exists(def.key)) {
        addPixelTexture(this, def.key, renderSheet(def), def.frameWidth, def.frameHeight);
        placeholderKeys.add(def.key);
      }
      if (def.frames > 1) {
        this.anims.create({ key: `${def.key}_loop`, frames: this.anims.generateFrameNumbers(def.key, { start: 0, end: def.frames - 1 }), frameRate: 8, repeat: -1 });
      }
    }
    addPixelTexture(this, DECOR_KEY, renderDecor(), 16, 16);
    addGlowTexture(this, 'glow', 64);
    addVignetteTexture(this, 'vignette', 256);
    addPixel(this, 'px');
    registerDebug('manifest', () => ALL_SHEETS);
    registerDebug('textures', () => ALL_SHEETS.map((def) => {
      const tex = this.textures.get(def.key);
      const first = tex.get(0);
      return { key: def.key, frames: tex.getFrameNames().filter((n) => n !== '__BASE').length, w: first.width, h: first.height, placeholder: placeholderKeys.has(def.key) };
    }));
    this.scene.start('Game');
  }
}

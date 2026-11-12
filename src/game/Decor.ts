import type * as Phaser from 'phaser';
import { DECOR_KEY } from '../art';
import { noise } from '../art/items';

const CHUNK = 96;
const PER_CHUNK = 5;

/** Deterministic flowers, stones and tufts scattered over the infinite meadow, reusing a fixed set of sprites. */
export class Decor {
  private readonly sprites: Phaser.GameObjects.Image[] = [];
  private lastKey = '';

  constructor(private readonly scene: Phaser.Scene) {}

  update(): void {
    const view = this.scene.cameras.main.worldView;
    const x0 = Math.floor((view.x - CHUNK) / CHUNK), x1 = Math.floor((view.right + CHUNK) / CHUNK);
    const y0 = Math.floor((view.y - CHUNK) / CHUNK), y1 = Math.floor((view.bottom + CHUNK) / CHUNK);
    const key = `${x0},${y0},${x1},${y1}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    let n = 0;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        for (let i = 0; i < PER_CHUNK; i++) {
          if (noise(cx, cy, 100 + i) > 0.62) continue;
          const frame = Math.floor(noise(cx, cy, 200 + i) * 6);
          const x = cx * CHUNK + noise(cx, cy, 300 + i) * CHUNK;
          const y = cy * CHUNK + noise(cx, cy, 400 + i) * CHUNK;
          const s = this.sprites[n] ?? this.sprites[this.sprites.push(this.scene.add.image(0, 0, DECOR_KEY, 0).setDepth(-5)) - 1];
          s.setFrame(frame).setPosition(Math.round(x), Math.round(y)).setVisible(true).setFlipX(noise(cx, cy, 500 + i) > 0.5);
          n++;
        }
      }
    }
    for (let i = n; i < this.sprites.length; i++) this.sprites[i].setVisible(false);
  }
}

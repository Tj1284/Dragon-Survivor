import type * as Phaser from 'phaser';
import { TEXT } from '../ui/style';

const MAX = 24;
const PER_FRAME = 6;
const LIFE = 0.5;

interface Num { text: Phaser.GameObjects.Text; t: number; x: number; y: number; color: string }

/** A slot is only reused once its number has been on screen this long, so numbers never flicker. */
const MIN_AGE = 0.2;

/** Small floating numbers on hits. A fixed pool and a per-frame cap keep big fights cheap. */
export class DamageNumbers {
  private readonly nums: Num[] = [];
  private next = 0;
  private spawnedThisFrame = 0;
  /** Debug counters. */
  shownTotal = 0;
  recycledYoung = 0;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX; i++) {
      const text = scene.add.text(0, 0, '', { ...TEXT, fontSize: '8px', stroke: '#1d1b2a', strokeThickness: 2 }).setOrigin(0.5).setDepth(36).setVisible(false);
      this.nums.push({ text, t: 0, x: 0, y: 0, color: '#ffffff' });
    }
  }

  show(x: number, y: number, amount: number, big: boolean): void {
    if (amount < 1 || this.spawnedThisFrame >= PER_FRAME) return;
    const n = this.nums[this.next];
    if (n.t > LIFE - MIN_AGE) return; // the oldest number is still fresh: skip rather than make it flicker
    if (n.t > 0 && n.t > LIFE - MIN_AGE) this.recycledYoung++;
    this.spawnedThisFrame++;
    this.shownTotal++;
    this.next = (this.next + 1) % MAX;
    n.t = LIFE;
    n.x = x + (Math.random() - 0.5) * 8;
    n.y = y - 8;
    const color = big ? '#f2c230' : '#ffffff';
    if (color !== n.color) { n.color = color; n.text.setColor(color); } // setColor always redraws the text
    n.text.setText(String(Math.round(amount))).setVisible(true).setAlpha(1).setPosition(n.x, n.y);
  }

  update(dt: number): void {
    this.spawnedThisFrame = 0;
    for (const n of this.nums) {
      if (n.t <= 0) continue;
      n.t -= dt;
      if (n.t <= 0) { n.text.setVisible(false); continue; }
      const k = 1 - n.t / LIFE;
      n.text.setPosition(Math.round(n.x), Math.round(n.y - k * 12)).setAlpha(1 - k * k);
    }
  }

  get active(): number {
    let a = 0;
    for (const n of this.nums) if (n.t > 0) a++;
    return a;
  }
}

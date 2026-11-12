import type * as Phaser from 'phaser';
import { PICKUP_SHEETS, type PickupKey } from '../assets/manifest';
import { PICKUPS } from '../config/balance';
import { Pool } from '../logic/pool';
import type { Player } from './Player';

interface Pickup { kind: 'xp' | 'gold'; value: number; x: number; y: number; flying: boolean; sprite: Phaser.GameObjects.Sprite }

export function gemKey(xp: number): PickupKey {
  return xp >= 5 ? 'gem_l' : xp >= 2 ? 'gem_m' : 'gem_s';
}

export class Pickups {
  private readonly pool: Pool<Pickup>;
  readonly active: Pickup[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.pool = new Pool<Pickup>(
      () => ({ kind: 'xp', value: 0, x: 0, y: 0, flying: false, sprite: scene.add.sprite(0, 0, 'gem_s').setDepth(2).setVisible(false) }),
      (p) => { p.sprite.setVisible(false).stop(); p.flying = false; },
    );
  }

  get activeCount(): number { return this.active.length; }
  get createdCount(): number { return this.pool.createdCount; }

  private drop(kind: Pickup['kind'], value: number, key: PickupKey, x: number, y: number): void {
    const p = this.pool.acquire();
    p.kind = kind; p.value = value; p.x = x; p.y = y; p.flying = false;
    p.sprite.setTexture(PICKUP_SHEETS[key].key, 0).setPosition(x, y).setVisible(true);
    if (this.scene.anims.exists(`${key}_loop`)) p.sprite.play(`${key}_loop`);
    this.active.push(p);
  }

  dropGem(x: number, y: number, xp: number): void { this.drop('xp', xp, gemKey(xp), x, y); }
  dropGold(x: number, y: number): void { this.drop('gold', 1, 'gold', x + 4, y + 2); }

  update(dt: number, player: Player, onXp: (n: number) => void, onGold: (n: number) => void): void {
    const r = player.stats.pickupRadius;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      const dx = player.x - p.x, dy = player.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d <= r) p.flying = true;
      if (p.flying && d > 0) {
        const step = Math.min(d, PICKUPS.flySpeed * dt);
        p.x += (dx / d) * step; p.y += (dy / d) * step;
        p.sprite.setPosition(p.x, p.y);
      }
      if (d <= PICKUPS.collectDistance) {
        if (p.kind === 'xp') onXp(p.value); else onGold(p.value);
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        this.pool.release(p);
      }
    }
  }
}

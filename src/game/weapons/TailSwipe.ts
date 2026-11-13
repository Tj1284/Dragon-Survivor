import type * as Phaser from 'phaser';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { isGold, params, weaponDamage } from './util';

/** Sweeps the half circle the dragon is facing. Gold (Terremoto): a full shockwave that pushes enemies away. */
export class TailSwipe implements Weapon {
  private timer = 0.6;
  private clearAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(12);
  }

  update(dt: number, now: number): void {
    if (this.clearAt > 0 && now >= this.clearAt) { this.g.clear(); this.clearAt = 0; }
    this.timer -= dt;
    if (this.timer > 0) return;
    const { player, enemies } = this.ctx;
    const p = params(this.ctx, 'tail_swipe');
    const gold = isGold(this.ctx, 'tail_swipe');
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    if (this.near.length === 0) return; // wait for someone to be in reach
    this.timer = p.cooldown * player.stats.cooldownMult;
    const facing = player.sprite.flipX ? -1 : 1;
    const dmg = weaponDamage(this.ctx, 'tail_swipe', p.damage);
    for (const e of this.near) {
      if (!gold && (e.x - player.x) * facing < -4) continue;
      enemies.hit(e, dmg, now, 'tail_swipe');
      if (gold) enemies.knockback(e, player.x, player.y, p.extra);
    }
    this.g.clear();
    this.g.fillStyle(gold ? 0xf2c230 : 0xffffff, 0.3);
    if (gold) this.g.fillCircle(player.x, player.y, p.radius);
    else {
      const mid = facing > 0 ? 0 : Math.PI;
      this.g.slice(player.x, player.y, p.radius, mid - Math.PI / 2, mid + Math.PI / 2, false);
      this.g.fillPath();
    }
    this.clearAt = now + 0.12;
  }

  destroy(): void { this.g.destroy(); }
}

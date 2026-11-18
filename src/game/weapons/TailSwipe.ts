import type * as Phaser from 'phaser';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
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
    const facing = player.sprite.flipX ? -1 : 1;
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    // keep only the enemies the swing can reach: the facing half, or everyone when gold
    if (!gold) {
      for (let i = this.near.length - 1; i >= 0; i--) {
        if ((this.near[i].x - player.x) * facing < -4) { this.near[i] = this.near[this.near.length - 1]; this.near.pop(); }
      }
    }
    if (this.near.length === 0) return; // hold the swing until someone is in reach
    this.timer = p.cooldown * player.stats.cooldownMult;
    weaponStats.tailSwings++;
    const dmg = weaponDamage(this.ctx, 'tail_swipe', p.damage);
    for (const e of this.near) {
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

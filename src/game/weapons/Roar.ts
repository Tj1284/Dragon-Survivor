import type * as Phaser from 'phaser';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { isGold, params, weaponDamage } from './util';

const STUN_SECONDS = 1;

/** A pulse that hurts and pushes nearby enemies away. Gold (Rugido atronador): it also stuns them. */
export class Roar implements Weapon {
  private timer = 1;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.ring = ctx.scene.add.circle(0, 0, 8, 0xffffff, 0).setStrokeStyle(2, 0xffffff, 1).setDepth(12).setVisible(false);
  }

  update(dt: number, now: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    const { player, enemies, scene } = this.ctx;
    const p = params(this.ctx, 'roar');
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    if (this.near.length === 0) return; // don't waste the roar on nobody
    this.timer = p.cooldown * player.stats.cooldownMult;
    const gold = isGold(this.ctx, 'roar');
    const dmg = weaponDamage(this.ctx, 'roar', p.damage);
    for (const e of this.near) {
      enemies.hit(e, dmg, now, 'roar');
      enemies.knockback(e, player.x, player.y, p.extra);
      if (gold) e.stunUntil = Math.max(e.stunUntil, now + STUN_SECONDS);
    }
    this.ring.setPosition(player.x, player.y).setRadius(8).setAlpha(1).setVisible(true).setStrokeStyle(2, gold ? 0xf2c230 : 0xffffff, 1);
    scene.tweens.add({ targets: this.ring, radius: p.radius, alpha: 0, duration: 260, onComplete: () => this.ring.setVisible(false) });
  }

  destroy(): void { this.ring.destroy(); }
}

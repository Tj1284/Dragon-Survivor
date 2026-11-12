import type * as Phaser from 'phaser';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { level } from './util';

export class FireOrbit implements Weapon {
  private angle = 0;
  private readonly orbs: Phaser.GameObjects.Sprite[] = [];
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number, now: number): void {
    const O = PLAYER_WEAPONS.fireOrbit;
    const n = level(this.ctx, 'fire_orbit');
    while (this.orbs.length < n) this.orbs.push(this.ctx.scene.add.sprite(0, 0, 'fire_orb').setDepth(15).play('fire_orb_loop'));
    this.angle += O.angularSpeed * dt;
    const { player, enemies } = this.ctx;
    const dmg = O.damage * player.stats.damageMult;
    this.orbs.forEach((orb, i) => {
      const a = this.angle + (i / this.orbs.length) * Math.PI * 2;
      const x = player.x + Math.cos(a) * O.radius, y = player.y + Math.sin(a) * O.radius;
      orb.setPosition(x, y);
      enemies.inRadius(x, y, O.hitRadius, this.near);
      for (const e of this.near) {
        const key = `orb${i}`;
        if ((e.hitCooldowns.get(key) ?? 0) > now) continue;
        e.hitCooldowns.set(key, now + O.hitCooldown);
        enemies.hit(e, dmg, now, 'fire_orbit');
      }
    });
  }

  destroy(): void { for (const o of this.orbs) o.destroy(); }
}

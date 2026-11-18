import type * as Phaser from 'phaser';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { params, weaponDamage } from './util';

const KEYS = Array.from({ length: 8 }, (_, i) => `orb${i}`);

/** Orbs circling the dragon. Gold (Anillo solar): 8 orbs, wider and faster. */
export class FireOrbit implements Weapon {
  private angle = 0;
  private readonly orbs: Phaser.GameObjects.Sprite[] = [];
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number, now: number): void {
    const O = PLAYER_WEAPONS.fireOrbit;
    const p = params(this.ctx, 'fire_orbit');
    while (this.orbs.length < p.count) this.orbs.push(this.ctx.scene.add.sprite(0, 0, 'fire_orb').setDepth(15).play('fire_orb_loop'));
    this.angle += p.extra * dt;
    const { player, enemies } = this.ctx;
    const dmg = weaponDamage(this.ctx, 'fire_orbit', p.damage);
    for (let i = 0; i < this.orbs.length; i++) {
      const a = this.angle + (i / this.orbs.length) * Math.PI * 2;
      const x = player.x + Math.cos(a) * p.radius, y = player.y + Math.sin(a) * p.radius;
      this.orbs[i].setPosition(x, y);
      enemies.inRadius(x, y, O.hitRadius, this.near);
      for (const e of this.near) {
        if ((e.hitCooldowns.get(KEYS[i]) ?? 0) > now) continue;
        e.hitCooldowns.set(KEYS[i], now + p.cooldown);
        enemies.hit(e, dmg, now, 'fire_orbit');
      }
    }
  }

  destroy(): void { for (const o of this.orbs) o.destroy(); }
}

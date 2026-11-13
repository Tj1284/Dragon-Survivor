import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { freeze } from './IceBreath';
import type { Weapon, WeaponCtx } from './types';
import { params, weaponDamage } from './util';

/** Cold zone around the dragon: slows and chips away. Gold (Cero absoluto): freezes whoever walks in. */
export class FrostAura implements Weapon {
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly near: Enemy[] = [];
  private tick = 0;

  constructor(private readonly ctx: WeaponCtx) {
    this.ring = ctx.scene.add.circle(0, 0, 40, COLORS.ice, 0.12).setStrokeStyle(1, COLORS.ice, 0.4).setDepth(1);
  }

  update(dt: number, now: number): void {
    const A = PLAYER_WEAPONS.frostAura;
    const { player, enemies } = this.ctx;
    const p = params(this.ctx, 'frost_aura');
    const gold = p.count === 2;
    this.ring.setPosition(player.x, player.y).setRadius(p.radius);
    this.tick -= dt;
    const hurt = this.tick <= 0;
    if (hurt) this.tick = p.cooldown;
    const dmg = weaponDamage(this.ctx, 'frost_aura', p.damage);
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    for (const e of this.near) {
      e.auraSlow = Math.max(e.auraSlow, p.extra);
      if (gold && (e.hitCooldowns.get('aura') ?? 0) <= now) {
        e.hitCooldowns.set('aura', now + A.goldFreezeEvery);
        freeze(e, now, A.goldFreeze);
      }
      if (hurt) enemies.hit(e, dmg, now, 'frost_aura');
    }
  }

  destroy(): void { this.ring.destroy(); }
}

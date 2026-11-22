import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, fireFan, isGold, params, weaponDamage } from './util';

/** Shadow wisps that chase the nearest enemy. Gold (Eclipse): they pass through 2 enemies and each kill heals. */
export class ShadowBreath implements Weapon {
  private cooldown = 0;

  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const B = PLAYER_WEAPONS.shadowBreath;
    const angle = aimAtNearest(this.ctx, B.range);
    if (angle === null) return;
    const { player } = this.ctx;
    const p = params(this.ctx, 'shadow_breath');
    const gold = isGold(this.ctx, 'shadow_breath');
    this.cooldown = p.cooldown * player.stats.cooldownMult;
    fireFan(this.ctx, angle, {
      key: 'shadow_bolt', source: 'shadow_breath', count: p.count, spreadDeg: 25, speed: B.speed,
      damage: weaponDamage(this.ctx, 'shadow_breath', p.damage), radius: p.radius, life: B.life, pierce: gold ? B.goldPierce : 0,
      homing: p.extra,
      onHit: gold ? (t) => {
        if ((t as Enemy).alive || player.hp <= 0) return;
        player.hp = Math.min(player.hpLimit, player.hp + B.goldHeal);
        weaponStats.healed += B.goldHeal;
      } : undefined,
    });
  }

  destroy(): void {}
}

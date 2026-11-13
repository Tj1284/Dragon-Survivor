import { PLAYER_WEAPONS } from '../../config/balance';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, fireFan, params, weaponDamage } from './util';

/** Hatchling's starting attack: small projectiles at the nearest enemy. Becomes the breath when the dragon evolves. */
export class Spit implements Weapon {
  private cooldown = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const S = PLAYER_WEAPONS.spit;
    const angle = aimAtNearest(this.ctx, S.range);
    if (angle === null) return;
    const p = params(this.ctx, 'spit');
    this.cooldown = p.cooldown * this.ctx.player.stats.cooldownMult;
    fireFan(this.ctx, angle, {
      key: 'spit', source: 'spit', count: p.count, spreadDeg: 12, speed: S.speed,
      damage: weaponDamage(this.ctx, 'spit', p.damage), radius: p.radius, life: S.range / S.speed + 0.2, pierce: 0,
    });
  }

  destroy(): void {}
}

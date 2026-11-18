import { PLAYER_WEAPONS } from '../../config/balance';
import { registerIceHit } from '../../logic/combat';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, fireFan, isGold, params, weaponDamage } from './util';

export function applyIce(e: Enemy, now: number): void {
  e.ice = registerIceHit(e.ice, now);
}

export function freeze(e: Enemy, now: number, seconds: number): void {
  e.ice = { ...e.ice, frozenUntil: Math.max(e.ice.frozenUntil, now + seconds) };
}

/** Fan of shards that slow and freeze. Gold (Ventisca): a huge fan that pierces. */
export class IceBreath implements Weapon {
  private cooldown = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const B = PLAYER_WEAPONS.iceBreath;
    const angle = aimAtNearest(this.ctx, B.range);
    if (angle === null) return;
    const p = params(this.ctx, 'ice_breath');
    const gold = isGold(this.ctx, 'ice_breath');
    this.cooldown = p.cooldown * this.ctx.player.stats.cooldownMult;
    fireFan(this.ctx, angle, {
      key: 'ice_shard', source: 'ice_breath', count: p.count, spreadDeg: B.spreadDeg, speed: B.speed,
      damage: weaponDamage(this.ctx, 'ice_breath', p.damage), radius: p.radius, life: B.range / B.speed + 0.1, pierce: gold ? 3 : 0,
      onHit: (t, _p, at) => applyIce(t as Enemy, at),
    });
  }

  destroy(): void {}
}

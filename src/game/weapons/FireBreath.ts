import { PLAYER_WEAPONS } from '../../config/balance';
import { FireZones } from './FireZones';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, fireFan, params, weaponDamage } from './util';

/** Fireballs that leave burning ground where they land. Gold (Infierno): bigger, longer, hotter zones. */
export class FireBreath implements Weapon {
  private cooldown = 0;
  private readonly zones: FireZones;

  constructor(private readonly ctx: WeaponCtx) {
    this.zones = new FireZones(ctx);
  }

  update(dt: number, now: number): void {
    this.zones.update(now);
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const B = PLAYER_WEAPONS.fireBreath;
    const angle = aimAtNearest(this.ctx, B.range);
    if (angle === null) return;
    const p = params(this.ctx, 'fire_breath');
    this.cooldown = p.cooldown * this.ctx.player.stats.cooldownMult;
    const leave = (proj: { x: number; y: number }, at: number) => this.zones.add(proj.x, proj.y, at, p.extra);
    fireFan(this.ctx, angle, {
      key: 'fire_orb', source: 'fire_breath', count: p.count, spreadDeg: 14, speed: B.speed,
      damage: weaponDamage(this.ctx, 'fire_breath', p.damage), radius: p.radius, life: B.range / B.speed + 0.1, pierce: 0,
      onHit: (_t, proj, at) => leave(proj, at), onExpire: leave,
    });
  }

  destroy(): void { this.zones.destroy(); }
}

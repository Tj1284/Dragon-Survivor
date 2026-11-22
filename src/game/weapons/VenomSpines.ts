import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, isGold, params, weaponDamage } from './util';

/** A ring of poisoned spines. Gold (Erizo): they pierce everything and a second ring follows. */
export class VenomSpines implements Weapon {
  private timer = 0.8;
  private echoAt = 0;
  private turn = 0;

  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number, now: number): void {
    const S = PLAYER_WEAPONS.venomSpines;
    if (this.echoAt > 0 && now >= this.echoAt) { this.echoAt = 0; this.burst(now, 0.5); }
    this.timer -= dt;
    if (this.timer > 0) return;
    if (aimAtNearest(this.ctx, S.triggerRange) === null) return;
    const p = params(this.ctx, 'venom_spines');
    this.timer = p.cooldown * this.ctx.player.stats.cooldownMult;
    this.burst(now, 0);
    if (isGold(this.ctx, 'venom_spines')) this.echoAt = now + S.goldDelay;
  }

  /** `offset` is a fraction of the gap between spines, so the second ring fills the first one's gaps. */
  private burst(_now: number, offset: number): void {
    const S = PLAYER_WEAPONS.venomSpines;
    const { player, projectiles, enemies } = this.ctx;
    const p = params(this.ctx, 'venom_spines');
    const gold = isGold(this.ctx, 'venom_spines');
    const dps = weaponDamage(this.ctx, 'venom_spines', p.extra);
    const damage = weaponDamage(this.ctx, 'venom_spines', p.damage);
    this.turn += 0.37;
    for (let i = 0; i < p.count; i++) {
      const a = this.turn + ((i + offset) / p.count) * Math.PI * 2;
      projectiles.fire({
        x: player.x, y: player.y, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed,
        damage, radius: p.radius, life: S.life, owner: 'player', key: 'spine', pierce: gold ? 999 : 0, source: 'venom_spines',
        onHit: (t, _p, at) => enemies.poison(t as Enemy, dps, PLAYER_WEAPONS.poison.duration, at),
      });
    }
    weaponStats.spines += p.count;
  }

  destroy(): void {}
}

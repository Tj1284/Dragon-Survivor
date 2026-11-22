import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, fireFan, isGold, params, weaponDamage } from './util';

/** Venom globs that poison what they hit. Gold (Plaga): stronger poison that spreads when a poisoned enemy dies. */
export class PoisonBreath implements Weapon {
  private cooldown = 0;

  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    const { enemies, player } = this.ctx;
    enemies.plagueRadius = isGold(this.ctx, 'poison_breath') ? PLAYER_WEAPONS.poison.plagueRadius : 0;
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const B = PLAYER_WEAPONS.poisonBreath;
    const angle = aimAtNearest(this.ctx, B.range);
    if (angle === null) return;
    const p = params(this.ctx, 'poison_breath');
    this.cooldown = p.cooldown * player.stats.cooldownMult;
    const dps = weaponDamage(this.ctx, 'poison_breath', p.extra);
    fireFan(this.ctx, angle, {
      key: 'poison_glob', source: 'poison_breath', count: p.count, spreadDeg: 12, speed: B.speed,
      damage: weaponDamage(this.ctx, 'poison_breath', p.damage), radius: p.radius, life: B.range / B.speed + 0.1, pierce: 0,
      onHit: (t, _p, at) => enemies.poison(t as Enemy, dps, PLAYER_WEAPONS.poison.duration, at),
    });
  }

  destroy(): void { this.ctx.enemies.plagueRadius = 0; }
}

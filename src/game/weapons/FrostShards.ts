import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { applyIce, freeze } from './IceBreath';
import type { Weapon, WeaponCtx } from './types';
import { params, weaponDamage } from './util';

/** Shards in random directions. Gold (Lanzas glaciales): they pierce everything and freeze on the first hit. */
export class FrostShards implements Weapon {
  private timer = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    const F = PLAYER_WEAPONS.frostShards;
    const { player, projectiles } = this.ctx;
    const p = params(this.ctx, 'frost_shards');
    const gold = p.extra === 1;
    this.timer = p.cooldown * player.stats.cooldownMult;
    const damage = weaponDamage(this.ctx, 'frost_shards', p.damage);
    for (let i = 0; i < p.count; i++) {
      const a = Math.random() * Math.PI * 2;
      projectiles.fire({
        x: player.x, y: player.y, vx: Math.cos(a) * F.speed, vy: Math.sin(a) * F.speed,
        damage, radius: p.radius, life: F.life, owner: 'player', key: 'ice_shard', pierce: gold ? 999 : 0, source: 'frost_shards',
        onHit: gold ? (t, _p, at) => freeze(t as Enemy, at, F.goldFreeze) : (t, _p, at) => applyIce(t as Enemy, at),
      });
    }
  }

  destroy(): void {}
}

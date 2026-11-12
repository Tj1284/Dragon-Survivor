import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { applyIce } from './IceBreath';
import type { Weapon, WeaponCtx } from './types';
import { level } from './util';

export class FrostShards implements Weapon {
  private timer = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number, now: number): void {
    const F = PLAYER_WEAPONS.frostShards;
    this.timer -= dt;
    if (this.timer > 0) return;
    const { player, projectiles } = this.ctx;
    this.timer = F.every * player.stats.cooldownMult;
    const n = level(this.ctx, 'frost_shards') + 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      projectiles.fire({
        x: player.x, y: player.y, vx: Math.cos(a) * F.speed, vy: Math.sin(a) * F.speed,
        damage: F.damage * player.stats.damageMult, radius: 4, life: F.life,
        owner: 'player', key: 'ice_shard', pierce: 0, source: 'frost_shards',
        onHit: (t) => applyIce(t as Enemy, now),
      });
    }
  }

  destroy(): void {}
}

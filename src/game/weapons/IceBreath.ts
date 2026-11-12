import { PLAYER_WEAPONS } from '../../config/balance';
import { registerIceHit } from '../../logic/combat';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';

export function applyIce(e: Enemy, now: number): void {
  e.ice = registerIceHit(e.ice, now);
}

export class IceBreath implements Weapon {
  private cooldown = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    const B = PLAYER_WEAPONS.iceBreath;
    const { player, enemies, projectiles } = this.ctx;
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const target = enemies.nearest(player.x, player.y, B.range);
    if (!target) return;
    this.cooldown = B.cooldown * player.stats.cooldownMult;
    const base = Math.atan2(target.y - player.y, target.x - player.x);
    const spread = (B.spreadDeg * Math.PI) / 180;
    for (let i = 0; i < B.shards; i++) {
      const a = base + (i - (B.shards - 1) / 2) * spread;
      projectiles.fire({
        x: player.x, y: player.y, vx: Math.cos(a) * B.speed, vy: Math.sin(a) * B.speed,
        damage: B.damage * player.stats.damageMult, radius: 4, life: B.range / B.speed + 0.1,
        owner: 'player', key: 'ice_shard', pierce: 0, source: 'ice',
        onHit: (t, _p, hitNow) => applyIce(t as Enemy, hitNow),
      });
    }
  }

  destroy(): void {}
}

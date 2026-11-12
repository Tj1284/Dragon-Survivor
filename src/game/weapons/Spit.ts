import { PLAYER_WEAPONS } from '../../config/balance';
import type { Weapon, WeaponCtx } from './types';

/** Hatchling's basic attack: a small projectile at the nearest enemy. */
export class Spit implements Weapon {
  private cooldown = 0;
  constructor(private readonly ctx: WeaponCtx) {}

  update(dt: number): void {
    const S = PLAYER_WEAPONS.spit;
    const { player, enemies, projectiles } = this.ctx;
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const target = enemies.nearest(player.x, player.y, S.range);
    if (!target) return;
    this.cooldown = S.cooldown * player.stats.cooldownMult;
    const dx = target.x - player.x, dy = target.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    projectiles.fire({
      x: player.x, y: player.y, vx: (dx / d) * S.speed, vy: (dy / d) * S.speed,
      damage: S.damage * player.stats.damageMult, radius: 4, life: S.range / S.speed + 0.2,
      owner: 'player', key: 'spit', pierce: 0, source: 'spit',
    });
  }

  destroy(): void {}
}

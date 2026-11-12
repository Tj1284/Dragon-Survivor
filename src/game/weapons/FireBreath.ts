import { PLAYER_WEAPONS } from '../../config/balance';
import type { Weapon, WeaponCtx } from './types';
import { FireZones } from './FireZones';

export class FireBreath implements Weapon {
  private cooldown = 0;
  private readonly zones: FireZones;

  constructor(private readonly ctx: WeaponCtx) {
    this.zones = new FireZones(ctx);
  }

  update(dt: number, now: number): void {
    const B = PLAYER_WEAPONS.fireBreath;
    const { player, enemies, projectiles } = this.ctx;
    this.zones.update(dt, now);
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const target = enemies.nearest(player.x, player.y, B.range);
    if (!target) return;
    this.cooldown = B.cooldown * player.stats.cooldownMult;
    const dx = target.x - player.x, dy = target.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    const leave = (p: { x: number; y: number }, at: number) => this.zones.add(p.x, p.y, at);
    projectiles.fire({
      x: player.x, y: player.y, vx: (dx / d) * B.speed, vy: (dy / d) * B.speed,
      damage: B.damage * player.stats.damageMult, radius: 5, life: B.range / B.speed + 0.1,
      owner: 'player', key: 'fire_orb', pierce: 0, source: 'fire',
      onHit: (_t, p, at) => leave(p, at), onExpire: leave,
    });
  }

  destroy(): void { this.zones.destroy(); }
}

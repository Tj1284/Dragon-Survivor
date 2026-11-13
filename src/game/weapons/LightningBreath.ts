import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import { chainTargets, type Point } from '../../logic/combat';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { drawBolt, isGold, params, weaponDamage } from './util';

export const lightningStats = { maxChain: 0 };

/** Instant bolt that jumps between enemies. Gold (Tormenta en cadena): twice the jumps, losing less damage. */
export class LightningBreath implements Weapon {
  private cooldown = 0;
  private flashUntil = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly near: Enemy[] = [];
  private readonly points: Point[] = [];
  private readonly byId = new Map<number, Enemy>();

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(30);
  }

  update(dt: number, now: number): void {
    const B = PLAYER_WEAPONS.lightningBreath;
    const { player, enemies } = this.ctx;
    if (now >= this.flashUntil) this.g.clear();
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const first = enemies.nearest(player.x, player.y, B.range);
    if (!first) return;
    const p = params(this.ctx, 'lightning_breath');
    this.cooldown = p.cooldown * player.stats.cooldownMult;

    enemies.inRadius(first.x, first.y, B.scanRadius, this.near);
    this.points.length = 0;
    this.byId.clear();
    for (const e of this.near) { this.byId.set(e.id, e); if (e !== first) this.points.push({ id: e.id, x: e.x, y: e.y }); }
    const rest = chainTargets(first, this.points, p.extra - 1, p.radius);

    this.g.clear();
    const decay = isGold(this.ctx, 'lightning_breath') ? B.goldDecay : B.decay;
    let dmg = weaponDamage(this.ctx, 'lightning_breath', p.damage);
    let px = player.x, py = player.y;
    let n = 0;
    const strike = (e: Enemy) => {
      drawBolt(this.g, px, py, e.x, e.y, COLORS.lightning);
      enemies.hit(e, dmg, now, 'lightning_breath');
      px = e.x; py = e.y; dmg *= decay; n++;
    };
    strike(first);
    for (const id of rest) strike(this.byId.get(id)!);
    this.flashUntil = now + 0.12;
    lightningStats.maxChain = Math.max(lightningStats.maxChain, n);
  }

  destroy(): void { this.g.destroy(); }
}

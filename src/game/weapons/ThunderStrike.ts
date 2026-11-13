import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { drawBolt, explode, params, visibleEnemies, weaponDamage } from './util';

/** Strikes up to `count` random visible enemies that are still alive; shared with the lightning ultimate. */
export function strikeRandom(ctx: WeaponCtx, g: Phaser.GameObjects.Graphics, scratch: Enemy[], count: number, damage: number, radius: number, now: number, source: string): void {
  visibleEnemies(ctx, scratch);
  for (let i = 0; i < count && scratch.length > 0; i++) {
    const k = Math.floor(Math.random() * scratch.length);
    const e = scratch[k];
    scratch[k] = scratch[scratch.length - 1];
    scratch.pop();
    if (!e.alive) { i--; continue; }
    drawBolt(g, e.x + (Math.random() - 0.5) * 20, e.y - 120, e.x, e.y, COLORS.lightning);
    explode(ctx, e.x, e.y, radius, damage, now, source);
  }
}

/** Lightning falls on random enemies. Gold (Juicio del trueno): five bolts at once. */
export class ThunderStrike implements Weapon {
  private timer = 1;
  private clearAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly scratch: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(30);
  }

  update(dt: number, now: number): void {
    if (now >= this.clearAt) this.g.clear();
    this.timer -= dt;
    if (this.timer > 0) return;
    const p = params(this.ctx, 'thunder_strike');
    this.timer = p.cooldown * this.ctx.player.stats.cooldownMult;
    this.g.clear();
    strikeRandom(this.ctx, this.g, this.scratch, p.count, weaponDamage(this.ctx, 'thunder_strike', p.damage), p.radius, now, 'thunder_strike');
    this.clearAt = now + 0.15;
  }

  destroy(): void { this.g.destroy(); }
}

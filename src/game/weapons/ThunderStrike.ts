import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { drawBolt, explode, level, visibleEnemies } from './util';

/** Strikes `count` random visible enemies; shared by Thunder Strike and the lightning ultimate. */
export function strikeRandom(ctx: WeaponCtx, g: Phaser.GameObjects.Graphics, scratch: Enemy[], count: number, damage: number, radius: number, now: number, source: string): void {
  visibleEnemies(ctx, scratch);
  for (let i = 0; i < count && scratch.length > 0; i++) {
    const e = scratch[Math.floor(Math.random() * scratch.length)];
    drawBolt(g, e.x + (Math.random() - 0.5) * 20, e.y - 120, e.x, e.y, COLORS.lightning);
    explode(ctx, e.x, e.y, radius, damage, now, source);
  }
}

export class ThunderStrike implements Weapon {
  private timer = 1;
  private clearAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly scratch: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(30);
  }

  update(dt: number, now: number): void {
    const T = PLAYER_WEAPONS.thunderStrike;
    if (now >= this.clearAt) this.g.clear();
    this.timer -= dt;
    if (this.timer > 0) return;
    const n = level(this.ctx, 'thunder_strike');
    this.timer = Math.max(0.5, T.base - T.perLevel * n) * this.ctx.player.stats.cooldownMult;
    this.g.clear();
    strikeRandom(this.ctx, this.g, this.scratch, 1, T.damage * this.ctx.player.stats.damageMult, T.radius, now, 'thunder_strike');
    this.clearAt = now + 0.15;
  }

  destroy(): void { this.g.destroy(); }
}

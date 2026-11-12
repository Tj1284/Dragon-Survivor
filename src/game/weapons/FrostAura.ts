import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { level } from './util';

export class FrostAura implements Weapon {
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    const A = PLAYER_WEAPONS.frostAura;
    this.ring = ctx.scene.add.circle(0, 0, A.radius, COLORS.ice, 0.12).setStrokeStyle(1, COLORS.ice, 0.4).setDepth(1);
  }

  update(): void {
    const A = PLAYER_WEAPONS.frostAura;
    const { player, enemies } = this.ctx;
    this.ring.setPosition(player.x, player.y);
    const slow = Math.min(A.maxSlow, A.slowPerLevel * level(this.ctx, 'frost_aura'));
    enemies.inRadius(player.x, player.y, A.radius, this.near);
    for (const e of this.near) e.auraSlow = Math.max(e.auraSlow, slow);
  }

  destroy(): void { this.ring.destroy(); }
}

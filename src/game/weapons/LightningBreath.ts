import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import { chainTargets, type Point } from '../../logic/combat';
import type { Enemy } from '../EnemyManager';
import type { Weapon, WeaponCtx } from './types';
import { drawBolt, level } from './util';

export const lightningStats = { maxChain: 0 };

export class LightningBreath implements Weapon {
  private cooldown = 0;
  private flashUntil = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly near: Enemy[] = [];
  private readonly points: Point[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(30);
  }

  update(dt: number, now: number): void {
    const B = PLAYER_WEAPONS.lightningBreath;
    const { player, enemies, run } = this.ctx;
    if (now >= this.flashUntil) this.g.clear();
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const first = enemies.nearest(player.x, player.y, B.range);
    if (!first) return;
    this.cooldown = B.cooldown * Math.pow(B.cooldownPerLevel, level(this.ctx, 'spark_speed')) * player.stats.cooldownMult;

    const jumps = 2 + run.stage + level(this.ctx, 'extra_jump');
    const range = B.chainRange * (1 + B.chainRangePerLevel * level(this.ctx, 'static_charge'));
    const decay = Math.min(B.maxDecay, B.decay + B.decayPerLevel * level(this.ctx, 'overcharge'));
    enemies.inRadius(first.x, first.y, B.scanRadius, this.near);
    this.points.length = 0;
    for (const e of this.near) if (e !== first) this.points.push({ id: e.id, x: e.x, y: e.y });
    const rest = chainTargets(first, this.points, jumps - 1, range);
    const byId = new Map(this.near.map((e) => [e.id, e]));
    const chain = [first, ...rest.map((id) => byId.get(id)!)];

    this.g.clear();
    let dmg = B.damage * player.stats.damageMult;
    let px = player.x, py = player.y;
    for (const e of chain) {
      drawBolt(this.g, px, py, e.x, e.y, COLORS.lightning);
      enemies.hit(e, dmg, now, 'lightning');
      px = e.x; py = e.y;
      dmg *= decay;
    }
    this.flashUntil = now + 0.12;
    lightningStats.maxChain = Math.max(lightningStats.maxChain, chain.length);
  }

  destroy(): void { this.g.destroy(); }
}

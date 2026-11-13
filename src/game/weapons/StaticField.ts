import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { drawBolt, isGold, params, weaponDamage } from './util';

const CHARGE_PX = 120;   // every 120 px flown adds +100% damage
const MAX_MULT = 3;
const MAX_STEP = 20;     // ignore teleports

/** Zaps the nearest enemies. Gold (Dinamo): the more the dragon has flown since the last zap, the harder it hits. */
export class StaticField implements Weapon {
  private timer = 0.5;
  private clearAt = 0;
  private moved = 0;
  private lastX: number;
  private lastY: number;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(30);
    this.lastX = ctx.player.x; this.lastY = ctx.player.y;
  }

  update(dt: number, now: number): void {
    const { player, enemies } = this.ctx;
    const gold = isGold(this.ctx, 'static_field');
    const step = Math.hypot(player.x - this.lastX, player.y - this.lastY);
    this.lastX = player.x; this.lastY = player.y;
    if (gold && step <= MAX_STEP) this.moved += step;
    const mult = gold ? Math.min(MAX_MULT, 1 + this.moved / CHARGE_PX) : 1;
    weaponStats.staticCharge = mult;
    if (this.clearAt > 0 && now >= this.clearAt) { this.g.clear(); this.clearAt = 0; }
    this.timer -= dt;
    if (this.timer > 0) return;
    const p = params(this.ctx, 'static_field');
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    if (this.near.length === 0) return; // keep charging until someone is in range
    this.timer = p.cooldown * player.stats.cooldownMult;
    const dmg = weaponDamage(this.ctx, 'static_field', p.damage) * mult;
    this.g.clear();
    let zapped = 0;
    for (let n = 0; n < p.extra && this.near.length > 0; n++) {
      let best = 0, bestD = Infinity;
      for (let i = 0; i < this.near.length; i++) {
        const d = (this.near[i].x - player.x) ** 2 + (this.near[i].y - player.y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      }
      const e = this.near[best];
      this.near[best] = this.near[this.near.length - 1];
      this.near.pop();
      drawBolt(this.g, player.x, player.y, e.x, e.y, gold ? 0xffffff : COLORS.lightning);
      enemies.hit(e, dmg, now, 'static_field');
      zapped++;
    }
    weaponStats.staticTargets = zapped;
    weaponStats.staticMult = mult;
    this.moved = 0;
    this.clearAt = now + 0.1;
  }

  destroy(): void { this.g.destroy(); }
}

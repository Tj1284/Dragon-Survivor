import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { isGold, params, weaponDamage } from './util';

/** A scythe sweep around the dragon that finishes off weakened enemies (never bosses). Gold (Segadora): two sweeps, executes at 30%. */
export class Reaper implements Weapon {
  private timer = 1;
  private echoAt = 0;
  private clearAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(12);
  }

  update(dt: number, now: number): void {
    if (this.clearAt > 0 && now >= this.clearAt) { this.g.clear(); this.clearAt = 0; }
    if (this.echoAt > 0 && now >= this.echoAt) { this.echoAt = 0; this.swing(now, true); }
    this.timer -= dt;
    if (this.timer > 0) return;
    const { player, enemies } = this.ctx;
    const p = params(this.ctx, 'reaper');
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    if (this.near.length === 0) return;
    this.timer = p.cooldown * player.stats.cooldownMult;
    this.swing(now, false);
    if (isGold(this.ctx, 'reaper')) this.echoAt = now + PLAYER_WEAPONS.reaper.goldDelay;
  }

  private swing(now: number, reverse: boolean): void {
    const { player, enemies } = this.ctx;
    const p = params(this.ctx, 'reaper');
    enemies.inRadius(player.x, player.y, p.radius, this.near);
    const dmg = weaponDamage(this.ctx, 'reaper', p.damage);
    for (const e of this.near) {
      if (enemies.hit(e, dmg, now, 'reaper')) continue;
      if (!e.boss && e.hp <= e.maxHp * p.extra) {
        enemies.hit(e, e.hp + 1, now, 'reaper');
        weaponStats.executed++;
      }
    }
    const start = reverse ? Math.PI : 0;
    this.g.clear();
    this.g.fillStyle(0x1a1824, 0.25).fillCircle(player.x, player.y, p.radius);
    this.g.lineStyle(4, COLORS.shadow, 0.9);
    this.g.beginPath();
    this.g.arc(player.x, player.y, p.radius - 3, start, start + Math.PI * 1.5, reverse);
    this.g.strokePath();
    this.g.lineStyle(1, 0xffd0e0, 0.9);
    this.g.beginPath();
    this.g.arc(player.x, player.y, p.radius - 1, start, start + Math.PI * 1.5, reverse);
    this.g.strokePath();
    this.clearAt = now + 0.15;
  }

  destroy(): void { this.g.destroy(); }
}

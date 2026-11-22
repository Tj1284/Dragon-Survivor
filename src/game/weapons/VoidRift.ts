import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { explode, params, visibleEnemies, weaponDamage } from './util';

interface Rift { x: number; y: number; r: number; pull: number; until: number; born: number; damage: number; live: boolean }

/** Opens a rift on an enemy that drags its neighbours in (bosses resist), then bursts. Gold (Agujero negro): two bigger rifts. */
export class VoidRift implements Weapon {
  private timer = 1.5;
  private readonly rifts: Rift[] = [];
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly seen: Enemy[] = [];
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    this.g = ctx.scene.add.graphics().setDepth(3);
    for (let i = 0; i < PLAYER_WEAPONS.voidRift.max; i++) this.rifts.push({ x: 0, y: 0, r: 0, pull: 0, until: 0, born: 0, damage: 0, live: false });
  }

  update(dt: number, now: number): void {
    const { enemies, player } = this.ctx;
    this.g.clear();
    for (const r of this.rifts) {
      if (!r.live) continue;
      if (now >= r.until) {
        r.live = false;
        explode(this.ctx, r.x, r.y, r.r, r.damage, now, 'void_rift');
        this.g.fillStyle(COLORS.shadow, 0.5).fillCircle(r.x, r.y, r.r);
        continue;
      }
      enemies.inRadius(r.x, r.y, r.r, this.near);
      for (const e of this.near) {
        if (e.boss) continue;
        const dx = r.x - e.x, dy = r.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 2) continue;
        const step = Math.min(d - 1, r.pull * dt);
        e.x += (dx / d) * step; e.y += (dy / d) * step;
        weaponStats.pulled++;
      }
      this.draw(r, now);
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    const p = params(this.ctx, 'void_rift');
    const targets = visibleEnemies(this.ctx, this.seen);
    if (targets.length === 0) return;
    this.timer = p.cooldown * player.stats.cooldownMult;
    for (let i = 0; i < p.count; i++) {
      const t = targets[Math.floor(Math.random() * targets.length)];
      this.open(t.x, t.y, p.radius, p.extra, weaponDamage(this.ctx, 'void_rift', p.damage), now);
    }
  }

  private open(x: number, y: number, radius: number, pull: number, damage: number, now: number): void {
    const r = this.rifts.find((o) => !o.live) ?? this.rifts[0];
    Object.assign(r, { x, y, r: radius, pull, damage, until: now + PLAYER_WEAPONS.voidRift.duration, born: now, live: true });
  }

  private draw(r: Rift, now: number): void {
    const grow = Math.min(1, (now - r.born) / 0.2);
    this.g.fillStyle(0x0c0a14, 0.35 * grow).fillCircle(r.x, r.y, r.r * grow);
    this.g.lineStyle(1, COLORS.shadow, 0.7 * grow).strokeCircle(r.x, r.y, r.r * grow);
    const spin = now * 5;
    this.g.lineStyle(2, 0xff7aa8, 0.8);
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI * 2) / 3;
      this.g.beginPath();
      this.g.arc(r.x, r.y, r.r * 0.45 * grow, a, a + 1.2);
      this.g.strokePath();
    }
    this.g.fillStyle(0x000000, 1).fillCircle(r.x, r.y, 5 * grow);
    this.g.lineStyle(1, 0xff3d7f, 1).strokeCircle(r.x, r.y, 5 * grow);
  }

  destroy(): void { this.g.destroy(); }
}

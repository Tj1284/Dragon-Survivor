import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { aimAtNearest, isGold, params, weaponDamage } from './util';

interface Cloud { x: number; y: number; r: number; until: number; born: number; nextTick: number; arc: Phaser.GameObjects.Arc; core: Phaser.GameObjects.Arc }

/** Drops a lingering poison cloud where the dragon is. Gold (Pantano): two bigger clouds that also slow. */
export class ToxicCloud implements Weapon {
  private timer = 0.5;
  private next = 0;
  private readonly clouds: Cloud[] = [];
  private readonly near: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    for (let i = 0; i < PLAYER_WEAPONS.toxicCloud.max; i++) {
      const arc = ctx.scene.add.circle(0, 0, 10, COLORS.poison, 0.22).setStrokeStyle(1, COLORS.poison, 0.6).setDepth(2).setVisible(false);
      const core = ctx.scene.add.circle(0, 0, 5, 0xd8ff9a, 0.18).setDepth(2).setVisible(false);
      this.clouds.push({ x: 0, y: 0, r: 0, until: 0, born: 0, nextTick: 0, arc, core });
    }
  }

  update(dt: number, now: number): void {
    const C = PLAYER_WEAPONS.toxicCloud;
    const { player, enemies } = this.ctx;
    const p = params(this.ctx, 'toxic_cloud');
    const gold = isGold(this.ctx, 'toxic_cloud');
    const dm = player.stats.damageMult;
    for (const c of this.clouds) {
      if (c.until <= now) { if (c.arc.visible) { c.arc.setVisible(false); c.core.setVisible(false); } continue; }
      const left = c.until - now, age = now - c.born;
      const fade = Math.min(1, left / 0.5, age / 0.25);
      const wobble = 1 + Math.sin(now * 4 + c.x) * 0.05;
      c.arc.setRadius(c.r * wobble).setAlpha(fade);
      c.core.setRadius(c.r * 0.55 * (2 - wobble)).setAlpha(fade);
      enemies.inRadius(c.x, c.y, c.r, this.near);
      if (gold) for (const e of this.near) if (!e.boss) e.auraSlow = Math.max(e.auraSlow, C.goldSlow);
      if (now >= c.nextTick) {
        c.nextTick = now + C.tick;
        const dmg = weaponDamage(this.ctx, 'toxic_cloud', p.damage) * C.tick;
        for (const e of this.near) {
          enemies.hit(e, dmg, now, 'toxic_cloud');
          enemies.poison(e, C.poisonDps * dm, PLAYER_WEAPONS.poison.duration, now);
        }
      }
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    if (aimAtNearest(this.ctx, C.triggerRange) === null) return; // hold until someone is close
    this.timer = p.cooldown * player.stats.cooldownMult;
    for (let i = 0; i < p.count; i++) {
      const a = Math.random() * Math.PI * 2;
      const off = i === 0 ? 0 : p.radius * 1.2;
      this.drop(player.x + Math.cos(a) * off, player.y + Math.sin(a) * off, p.radius, now + p.extra, now);
    }
  }

  private drop(x: number, y: number, r: number, until: number, now: number): void {
    const c = this.clouds[this.next];
    this.next = (this.next + 1) % this.clouds.length;
    c.x = x; c.y = y; c.r = r; c.until = until; c.born = now; c.nextTick = now;
    c.arc.setPosition(x, y).setVisible(true);
    c.core.setPosition(x, y).setVisible(true);
    weaponStats.clouds++;
  }

  destroy(): void { for (const c of this.clouds) { c.arc.destroy(); c.core.destroy(); } }
}

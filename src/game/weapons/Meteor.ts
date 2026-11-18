import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import type { Enemy } from '../EnemyManager';
import { weaponStats } from './stats';
import type { Weapon, WeaponCtx } from './types';
import { explode, params, visibleEnemies, weaponDamage } from './util';

const FALL_SECONDS = 0.35;
const FALL_HEIGHT = 90;
const MAX_METEORS = 3;

interface Falling { active: boolean; x: number; y: number; t: number; radius: number; damage: number; rock: Phaser.GameObjects.Sprite; blast: Phaser.GameObjects.Arc }

/** A meteor falls on a random enemy and explodes. Gold (Lluvia de meteoros): three at once. */
export class Meteor implements Weapon {
  private timer = 1.2;
  private readonly slots: Falling[] = [];
  private readonly scratch: Enemy[] = [];

  constructor(private readonly ctx: WeaponCtx) {
    for (let i = 0; i < MAX_METEORS; i++) {
      this.slots.push({
        active: false, x: 0, y: 0, t: 0, radius: 0, damage: 0,
        rock: ctx.scene.add.sprite(0, 0, 'fire_orb').setDepth(32).setScale(1.5).setVisible(false),
        blast: ctx.scene.add.circle(0, 0, 10, COLORS.fire, 0.5).setDepth(3).setVisible(false),
      });
    }
  }

  update(dt: number, now: number): void {
    for (const m of this.slots) {
      if (m.blast.visible) { m.blast.setAlpha(m.blast.alpha - dt * 2.5); if (m.blast.alpha <= 0) m.blast.setVisible(false); }
      if (!m.active) continue;
      m.t += dt;
      const k = Math.min(1, m.t / FALL_SECONDS);
      m.rock.setPosition(m.x + (1 - k) * 20, m.y - (1 - k) * FALL_HEIGHT);
      if (k >= 1) {
        m.active = false;
        m.rock.setVisible(false).stop();
        m.blast.setPosition(m.x, m.y).setRadius(m.radius).setAlpha(0.55).setVisible(true);
        explode(this.ctx, m.x, m.y, m.radius, m.damage, now, 'meteor');
      }
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    visibleEnemies(this.ctx, this.scratch);
    if (this.scratch.length === 0) return;
    const p = params(this.ctx, 'meteor');
    this.timer = p.cooldown * this.ctx.player.stats.cooldownMult;
    const damage = weaponDamage(this.ctx, 'meteor', p.damage);
    let launched = 0;
    for (const m of this.slots) {
      if (launched >= p.count || this.scratch.length === 0) break;
      if (m.active) continue;
      const i = Math.floor(Math.random() * this.scratch.length);
      const e = this.scratch[i];
      this.scratch[i] = this.scratch[this.scratch.length - 1];
      this.scratch.pop();
      m.active = true; m.x = e.x; m.y = e.y; m.t = 0; m.radius = p.radius; m.damage = damage;
      m.rock.setVisible(true).play('fire_orb_loop');
      launched++;
    }
    weaponStats.meteorVolley = launched;
  }

  destroy(): void { for (const m of this.slots) { m.rock.destroy(); m.blast.destroy(); } }
}

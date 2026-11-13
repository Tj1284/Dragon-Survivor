import type * as Phaser from 'phaser';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { WeaponCtx } from './types';
import { explode, isGold, weaponDamage } from './util';

interface Zone { x: number; y: number; r: number; until: number; nextTick: number; sprite: Phaser.GameObjects.Sprite }

/** Burning ground left by the fire breath. Fixed-size ring buffer: the oldest zone is recycled. */
export class FireZones {
  private readonly zones: Zone[] = [];
  private next = 0;

  constructor(private readonly ctx: WeaponCtx) {
    const Z = PLAYER_WEAPONS.fireZone;
    for (let i = 0; i < Z.max; i++) {
      const sprite = ctx.scene.add.sprite(0, 0, 'fire_zone').setDepth(1).setVisible(false).setAlpha(0.8);
      this.zones.push({ x: 0, y: 0, r: 0, until: 0, nextTick: 0, sprite });
    }
  }

  add(x: number, y: number, now: number, radius: number): void {
    const Z = PLAYER_WEAPONS.fireZone;
    const z = this.zones[this.next];
    this.next = (this.next + 1) % this.zones.length;
    z.x = x; z.y = y; z.r = radius;
    z.until = now + Z.duration * (isGold(this.ctx, 'fire_breath') ? Z.goldDuration : 1);
    z.nextTick = now;
    z.sprite.setPosition(x, y).setVisible(true).setScale(z.r / 16).play('fire_zone_loop');
  }

  update(now: number): void {
    const Z = PLAYER_WEAPONS.fireZone;
    const dmg = weaponDamage(this.ctx, 'fire_breath', Z.damage * (isGold(this.ctx, 'fire_breath') ? Z.goldDamage : 1));
    for (const z of this.zones) {
      if (z.until <= now) { if (z.sprite.visible) z.sprite.setVisible(false).stop(); continue; }
      if (now >= z.nextTick) {
        z.nextTick = now + Z.tick;
        explode(this.ctx, z.x, z.y, z.r, dmg, now, 'fire_breath');
      }
    }
  }

  destroy(): void { for (const z of this.zones) z.sprite.destroy(); }
}

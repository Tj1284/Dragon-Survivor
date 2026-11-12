import type * as Phaser from 'phaser';
import { COLORS } from '../../assets/manifest';
import { PLAYER_WEAPONS } from '../../config/balance';
import type { Element } from '../../logic/types';
import type { Enemy } from '../EnemyManager';
import { strikeRandom } from './ThunderStrike';
import type { Weapon, WeaponCtx } from './types';
import { explode, visibleEnemies } from './util';

/** Legendary-only area attack, automatic every 20 s. */
export class Ultimate implements Weapon {
  private timer: number;
  private clearAt = 0;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly scratch: Enemy[] = [];
  fired = 0;

  constructor(private readonly ctx: WeaponCtx, private readonly element: Element) {
    this.g = ctx.scene.add.graphics().setDepth(30);
    this.timer = 2;
  }

  update(dt: number, now: number): void {
    const U = PLAYER_WEAPONS.ultimate;
    if (now >= this.clearAt) this.g.clear();
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = U.every;
    this.fired++;
    const { player } = this.ctx;
    const dm = player.stats.damageMult;
    this.g.clear();
    if (this.element === 'fire') {
      this.g.fillStyle(COLORS.fire, 0.35).fillCircle(player.x, player.y, U.fireRadius);
      explode(this.ctx, player.x, player.y, U.fireRadius, U.fireDamage * dm, now, 'ultimate');
    } else if (this.element === 'ice') {
      for (const e of visibleEnemies(this.ctx, this.scratch)) e.ice = { ...e.ice, frozenUntil: now + U.iceFreeze };
      const view = this.ctx.scene.cameras.main.worldView;
      this.g.fillStyle(COLORS.ice, 0.25).fillRect(view.x, view.y, view.width, view.height);
    } else {
      strikeRandom(this.ctx, this.g, this.scratch, U.lightningStrikes, U.lightningDamage * dm, 16, now, 'ultimate');
    }
    this.clearAt = now + 0.3;
  }

  destroy(): void { this.g.destroy(); }
}

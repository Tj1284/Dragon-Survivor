import * as Phaser from 'phaser';
import { onTap } from './ui';
import { t } from '../i18n';
import { xpToNext } from '../logic/xp';
import { formatTime } from '../scenes/GameOverScene';
import type { Player } from './Player';
import type { RunState } from './RunState';

import { TEXT as BASE_TEXT } from '../ui/style';
const TEXT = { ...BASE_TEXT, stroke: '#000000', strokeThickness: 3 } as const;
const HP_W = 60;

/** Screen-space HUD: xp bar on top, hp + level below it, timer centered, gold and pause on the right. */
export class Hud {
  private readonly xpBg: Phaser.GameObjects.Rectangle;
  private readonly xpFill: Phaser.GameObjects.Rectangle;
  private readonly hpBg: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly level: Phaser.GameObjects.Text;
  private readonly timer: Phaser.GameObjects.Text;
  private readonly gold: Phaser.GameObjects.Text;
  private readonly pauseHit: Phaser.GameObjects.Rectangle;
  private readonly pauseBars: Phaser.GameObjects.Rectangle[];
  private width = 0;

  constructor(scene: Phaser.Scene, onPause: () => void) {
    const fixed = <T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T): T => { o.setScrollFactor(0); o.setDepth(500); return o; };
    this.xpBg = fixed(scene.add.rectangle(0, 0, 10, 4, 0x000000, 0.6).setOrigin(0));
    this.xpFill = fixed(scene.add.rectangle(0, 0, 0, 4, 0x4fd6a8).setOrigin(0));
    this.hpBg = fixed(scene.add.rectangle(4, 8, HP_W, 5, 0x000000, 0.6).setOrigin(0));
    this.hpFill = fixed(scene.add.rectangle(4, 8, HP_W, 5, 0xe84a5f).setOrigin(0));
    this.level = fixed(scene.add.text(HP_W + 8, 6, '', { ...TEXT, fontSize: '8px' }));
    this.timer = fixed(scene.add.text(0, 6, '00:00', { ...TEXT, fontSize: '8px' }).setOrigin(0.5, 0));
    this.gold = fixed(scene.add.text(0, 7, '', { ...TEXT, fontSize: '8px', color: '#f2c230' }).setOrigin(1, 0));
    this.pauseHit = fixed(scene.add.rectangle(0, 0, 24, 24, 0x000000, 0.35).setStrokeStyle(1, 0xffffff, 0.6));
    this.pauseBars = [fixed(scene.add.rectangle(0, 0, 3, 10, 0xffffff)), fixed(scene.add.rectangle(0, 0, 3, 10, 0xffffff))];
    onTap(this.pauseHit.setInteractive({ useHandCursor: true }), onPause);
    this.layout(scene.scale.gameSize.width, scene.scale.gameSize.height);
  }

  layout(width: number, _height: number): void {
    this.width = width;
    this.xpBg.setSize(width, 4);
    this.timer.setX(Math.round(width / 2));
    const px = width - 16, py = 20;
    this.pauseHit.setPosition(px, py);
    this.pauseBars[0].setPosition(px - 3, py);
    this.pauseBars[1].setPosition(px + 3, py);
    this.gold.setX(width - 32);
  }

  update(run: RunState, player: Player): void {
    this.xpFill.setSize(Math.round((this.width * run.xp) / xpToNext(run.level)), 4);
    this.hpFill.setSize(Math.round(HP_W * Phaser.Math.Clamp(player.hp / player.stats.maxHp, 0, 1)), 5);
    this.level.setText(t('lvl_short', { n: run.level }));
    this.timer.setText(formatTime(run.elapsed));
    this.gold.setText(`● ${run.gold}`);
  }

  positions() {
    return {
      timer: { x: this.timer.x, y: this.timer.y },
      hp: { x: this.hpBg.x, y: this.hpBg.y, w: HP_W },
      xp: { x: this.xpBg.x, y: this.xpBg.y, w: this.xpBg.width },
      gold: { x: this.gold.x, y: this.gold.y },
      pause: { x: this.pauseHit.x, y: this.pauseHit.y },
    };
  }
}

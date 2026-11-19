import * as Phaser from 'phaser';
import { onTap } from './ui';
import { ICON_SHEETS } from '../assets/manifest';
import { MAX_SLOTS, type AttackId } from '../logic/attacks';
import { t } from '../i18n';
import { xpToNext } from '../logic/xp';
import { formatTime } from '../scenes/GameOverScene';
import type { Player } from './Player';
import type { RunState } from './RunState';

import { TEXT as BASE_TEXT } from '../ui/style';
const TEXT = { ...BASE_TEXT, stroke: '#000000', strokeThickness: 3 } as const;
const HP_W = 60;
const GOLD = 0xf2c230;

interface Slot { id: AttackId | null; level: number; gold: boolean; frame: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text }

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
  private readonly slots: Slot[] = [];
  private readonly bossBg: Phaser.GameObjects.Rectangle;
  private readonly bossFill: Phaser.GameObjects.Rectangle;
  private readonly bossName: Phaser.GameObjects.Text;
  private bossW = 0;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly chestArrow: Phaser.GameObjects.Triangle;
  private hintTween: Phaser.Tweens.Tween | null = null;

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
    this.bossBg = fixed(scene.add.rectangle(0, 0, 10, 6, 0x000000, 0.65).setOrigin(0.5).setStrokeStyle(1, 0xffffff, 0.7).setVisible(false));
    this.bossFill = fixed(scene.add.rectangle(0, 0, 10, 4, 0xc8302a).setOrigin(0, 0.5).setVisible(false));
    this.bossName = fixed(scene.add.text(0, 0, '', { ...TEXT, fontSize: '8px' }).setOrigin(0.5, 1).setVisible(false));
    this.chestArrow = fixed(scene.add.triangle(0, 0, 0, -6, 12, 0, 0, 6, 0xf2c230).setStrokeStyle(1, 0x2a1608).setVisible(false));
    this.hint = fixed(scene.add.text(0, 0, '', { ...TEXT, fontSize: '8px', align: 'center', backgroundColor: '#1d1b2acc', padding: { x: 6, y: 4 } }).setOrigin(0.5).setVisible(false));
    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = 13 + i * 21, y = 27;
      this.slots.push({
        id: null, level: 0, gold: false,
        frame: fixed(scene.add.rectangle(x, y, 18, 18, 0x000000, 0.45).setStrokeStyle(1, 0xffffff, 0.5).setVisible(false)),
        icon: fixed(scene.add.image(x, y, ICON_SHEETS.spit.key).setVisible(false)),
        label: fixed(scene.add.text(x + 10, y + 11, '', { ...TEXT, fontSize: '8px' }).setOrigin(1, 1).setVisible(false)),
      });
    }
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
    this.bossW = Math.min(200, width - 80);
    const by = 52;
    this.bossBg.setPosition(Math.round(width / 2), by).setSize(this.bossW + 2, 6);
    this.bossFill.setPosition(Math.round(width / 2 - this.bossW / 2), by);
    this.bossName.setPosition(Math.round(width / 2), by - 4);
    this.hint.setPosition(Math.round(width / 2), Math.round(_height * 0.72));
  }

  /** Points at an off-screen chest from the edge of the screen; pass null to hide. */
  pointTo(target: { dx: number; dy: number } | null, width: number, height: number): void {
    if (!target) { this.chestArrow.setVisible(false); return; }
    const angle = Math.atan2(target.dy, target.dx);
    const cx = width / 2, cy = height / 2;
    const margin = 18;
    const sx = (cx - margin) / Math.max(1e-6, Math.abs(Math.cos(angle)));
    const sy = (cy - margin) / Math.max(1e-6, Math.abs(Math.sin(angle)));
    const r = Math.min(sx, sy);
    this.chestArrow.setVisible(true).setPosition(Math.round(cx + Math.cos(angle) * r), Math.round(cy + Math.sin(angle) * r)).setRotation(angle);
  }

  showHint(text: string): void {
    this.hint.setText(text).setVisible(true).setAlpha(1);
    this.hintTween = this.hint.scene.tweens.add({ targets: this.hint, alpha: 0.55, duration: 600, yoyo: true, repeat: -1 });
  }

  hideHint(): void {
    this.hintTween?.stop();
    this.hint.setVisible(false);
  }

  /** Shows the boss health bar, or hides it when `ratio` is null. */
  setBoss(name: string | null, ratio: number): void {
    const on = name !== null;
    this.bossBg.setVisible(on); this.bossFill.setVisible(on); this.bossName.setVisible(on);
    if (!on) return;
    if (this.bossName.text !== name) this.bossName.setText(name);
    this.bossFill.setSize(Math.max(0, Math.round(this.bossW * Phaser.Math.Clamp(ratio, 0, 1))), 4);
  }

  update(run: RunState, player: Player): void {
    this.xpFill.setSize(Math.round((this.width * run.xp) / xpToNext(run.level)), 4);
    this.hpFill.setSize(Math.round(HP_W * Phaser.Math.Clamp(player.hp / player.stats.maxHp, 0, 1)), 5);
    this.level.setText(t('lvl_short', { n: run.level }));
    this.timer.setText(formatTime(run.elapsed));
    this.gold.setText(`● ${run.gold}`);
  }

  /** Call whenever the held attacks, their levels or their gold state change. */
  refreshAttacks(run: RunState): void {
    const held = run.attackOrder.filter((id) => (run.owned[id] ?? 0) > 0);
    this.slots.forEach((slot, i) => {
      const id = held[i] ?? null;
      slot.id = id;
      slot.frame.setVisible(id !== null);
      slot.icon.setVisible(id !== null);
      slot.label.setVisible(id !== null);
      if (id === null) return;
      slot.level = run.owned[id] ?? 0;
      slot.gold = run.goldAttacks.includes(id);
      slot.icon.setTexture(ICON_SHEETS[id].key);
      slot.frame.setStrokeStyle(slot.gold ? 2 : 1, slot.gold ? GOLD : 0xffffff, slot.gold ? 1 : 0.5);
      slot.label.setText(String(slot.level)).setColor(slot.gold ? '#f2c230' : '#ffffff');
    });
  }

  positions() {
    return {
      timer: { x: this.timer.x, y: this.timer.y },
      hp: { x: this.hpBg.x, y: this.hpBg.y, w: HP_W },
      xp: { x: this.xpBg.x, y: this.xpBg.y, w: this.xpBg.width },
      gold: { x: this.gold.x, y: this.gold.y },
      pause: { x: this.pauseHit.x, y: this.pauseHit.y },
      bossBar: { visible: this.bossBg.visible, name: this.bossName.text },
      hint: { visible: this.hint.visible, text: this.hint.text },
      chestArrow: { visible: this.chestArrow.visible, x: this.chestArrow.x, y: this.chestArrow.y },
      attacks: this.slots.filter((s) => s.id !== null).map((s) => ({ id: s.id, level: s.level, gold: s.gold, x: s.frame.x, y: s.frame.y })),
    };
  }
}

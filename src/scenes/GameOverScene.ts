import * as Phaser from 'phaser';
import { relayoutOnResize } from '../game/ui';
import { addRunResult } from '../logic/save';
import { storage } from '../platform/storage';
import { audio } from '../audio';
import { describeButtons, makeButton } from '../ui/button';
import { DRAGON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import { platform } from '../platform/bridge';
import type { FormId } from '../logic/types';

export interface GameOverData { time: number; level: number; formId: FormId; gold: number; won: boolean; runId: number; forms: FormId[]; banked: number }

/** Runs already added to the save: rebuilding this screen (e.g. on rotation) must not add the gold twice. */
const savedRuns = new Set<number>();
/** Runs whose gold was already doubled by a rewarded ad. */
const doubledRuns = new Set<number>();

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

import { TEXT } from '../ui/style';
import { background, panel, stars } from '../ui/kit';

export class GameOverScene extends Phaser.Scene {
  /** Bumped on every build of the screen (rotation rebuilds it): late ad results only touch the screen they came from. */
  private build = 0;
  private leaving = false;

  constructor() { super('GameOver'); }

  create(data: GameOverData): void {
    relayoutOnResize(this, data);
    const build = ++this.build;
    const current = () => build === this.build && this.scene.isActive();
    this.leaving = false;
    if (!savedRuns.has(data.runId)) {
      savedRuns.add(data.runId);
      audio.play(data.won ? 'victory' : 'defeat');
      audio.playMusic(data.won ? 'ending' : null);
      storage.save(addRunResult(storage.load(), { gold: data.gold - data.banked, time: data.time, won: data.won, forms: data.forms }));
    }
    const { width: w, height: h } = this.scale.gameSize;
    const landscape = w >= h;
    background(this, landscape ? 0.5 : 0.62, 0.45);
    stars(this, 16, h * 0.25);
    // vertical rhythm: fixed rows in landscape (270 px tall), proportional in portrait
    const row = landscape
      ? { title: 26, dragon: 78, stats: 124, double: 152, again: 186, small: 222 }
      : { title: h * 0.13, dragon: h * 0.29, stats: h * 0.43, double: h * 0.52, again: h * 0.62, small: h * 0.7 };

    const title = this.add.text(w / 2, row.title, t(data.won ? 'victory' : 'game_over').toUpperCase(),
      { ...TEXT, fontSize: '16px', color: data.won ? '#f2c230' : '#ffd76a', stroke: '#5a1010', strokeThickness: 4 }).setOrigin(0.5);
    if (title.width * 2 <= w - 16) title.setScale(2);
    registerDebug('gameOver', () => ({ ...data }));
    const def = DRAGON_SHEETS[data.formId];
    const scale = def.frameHeight >= 64 ? 1 : 2;
    this.add.image(w / 2, row.dragon + def.frameHeight * scale * 0.42, 'glow').setTint(0xd8ff7a).setAlpha(0.35).setScale(1.2, 0.26);
    const dragon = this.add.sprite(w / 2, row.dragon, def.key).play(`${def.key}_loop`).setScale(scale);
    this.tweens.add({ targets: dragon, y: row.dragon - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // stats on a stone panel; the gold counts up
    const shownGold = () => (doubledRuns.has(data.runId) ? data.gold * 2 : data.gold);
    const statLine = (gold: number) => `${t('time')} ${formatTime(data.time)}  ·  ${t('level_n', { n: data.level })}  ·  ${t('gold')} ${gold}`;
    const stats = this.add.text(w / 2, row.stats, statLine(shownGold()), { ...TEXT, fontSize: '8px', color: '#ffffff' }).setOrigin(0.5);
    panel(this, w / 2, row.stats, Math.min(w - 12, stats.width + 28), 22);
    this.children.bringToTop(stats);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: shownGold(), duration: 700, delay: 250, ease: 'Cubic.Out', onUpdate: () => stats.setText(statLine(Math.round(counter.v))) });
    const setGoldShown = () => stats.setText(statLine(shownGold()));

    // an interstitial at this natural pause; Bridge decides whether one actually shows
    // an interstitial at this natural pause, played out before moving on so it never lands on the next run
    const leave = (scene: string) => {
      if (this.leaving) return;
      this.leaving = true;
      void platform.interstitial('game_over').then(() => { if (this.scene.isActive()) this.scene.start(scene); });
    };
    const again = makeButton(this, 'again', w / 2, row.again, 170, 30, t('again'), 0xe8542a, () => leave('Game'), '16px', 'play');
    const sw = Math.min(110, (w - 24) / 2 - 4);
    const lair = makeButton(this, 'lair', w / 2 - sw / 2 - 4, row.small, sw, 22, t('lair'), 0x5a3f8f, () => leave('Lair'), '8px', 'lair');
    const menu = makeButton(this, 'menu', w / 2 + sw / 2 + 4, row.small, sw, 22, t('menu'), 0x5a3f8f, () => leave('Menu'), '8px', 'back');
    const buttons = [again, lair, menu];
    if (data.gold > 0 && platform.rewardedSupported && !doubledRuns.has(data.runId)) {
      let busy = false;
      const double = makeButton(this, 'double', w / 2, row.double, 190, 22, t('double_gold'), 0xc8901a, () => {
        if (busy) return;
        busy = true;
        void platform.rewarded('double_gold').then((ok) => {
          busy = false;
          if (ok && !doubledRuns.has(data.runId)) {
            doubledRuns.add(data.runId);
            const s = storage.load();
            storage.save({ ...s, gold: s.gold + data.gold });
          }
          if (!current()) {
            // the screen was rebuilt (rotation) while the ad played: rebuild again to show the result
            if (ok && this.scene.isActive() && !this.leaving) this.scene.restart(data);
            return;
          }
          if (!ok) { double.label.setText(t('ad_failed')); return; }
          this.tweens.killTweensOf(counter);
          setGoldShown();
          double.label.setText(t('gold_doubled'));
          double.bg.disableInteractive();
        });
      }, '8px', 'coin');
      this.tweens.add({ targets: double.bg, scaleX: 1.04, scaleY: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      buttons.push(double);
    }
    this.input.keyboard?.once('keydown-ENTER', () => leave('Game'));
    this.input.keyboard?.once('keydown-SPACE', () => leave('Game'));
    registerDebug('buttons', () => describeButtons(buttons));
    const btn = again.bg;
    registerDebug('againButton', () => ({ x: btn.x, y: btn.y }));
  }
}

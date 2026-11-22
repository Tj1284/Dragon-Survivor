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
    this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setOrigin(0);
    this.add.text(w / 2, h * 0.16, t(data.won ? 'victory' : 'game_over'), { ...TEXT, fontSize: '16px', color: data.won ? '#f2c230' : '#ffffff' }).setOrigin(0.5);
    registerDebug('gameOver', () => ({ ...data }));
    this.add.sprite(w / 2, h * 0.36, DRAGON_SHEETS[data.formId].key).play(`${DRAGON_SHEETS[data.formId].key}_loop`).setScale(DRAGON_SHEETS[data.formId].frameHeight >= 64 ? 1 : 2);
    const goldLine = () => `${t('gold')}: ${doubledRuns.has(data.runId) ? data.gold * 2 : data.gold}`;
    const lines = [`${t('time')}: ${formatTime(data.time)}`, t('level_n', { n: data.level }), goldLine()];
    const stats = this.add.text(w / 2, h * 0.53, lines.join('\n'), { ...TEXT, fontSize: '8px', align: 'center' }).setOrigin(0.5);

    const btnY = h * 0.76;
    // an interstitial at this natural pause; Bridge decides whether one actually shows
    // an interstitial at this natural pause, played out before moving on so it never lands on the next run
    const leave = (scene: string) => {
      if (this.leaving) return;
      this.leaving = true;
      void platform.interstitial('game_over').then(() => { if (this.scene.isActive()) this.scene.start(scene); });
    };
    const again = makeButton(this, 'again', w / 2, btnY, 130, 30, t('again'), 0xe8542a, () => leave('Game'));
    const lair = makeButton(this, 'lair', w / 2 - 58, btnY + 38, 100, 22, t('lair'), 0x5a3f8f, () => leave('Lair'), '8px');
    const menu = makeButton(this, 'menu', w / 2 + 58, btnY + 38, 100, 22, t('menu'), 0x5a3f8f, () => leave('Menu'), '8px');
    const buttons = [again, lair, menu];
    if (data.gold > 0 && platform.rewardedSupported && !doubledRuns.has(data.runId)) {
      let busy = false;
      const double = makeButton(this, 'double', w / 2, h * 0.64, 170, 20, t('double_gold'), 0x8a6a10, () => {
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
          lines[2] = goldLine();
          stats.setText(lines.join('\n'));
          double.label.setText(t('gold_doubled'));
          double.bg.disableInteractive();
        });
      }, '8px');
      buttons.push(double);
    }
    this.input.keyboard?.once('keydown-ENTER', () => leave('Game'));
    this.input.keyboard?.once('keydown-SPACE', () => leave('Game'));
    registerDebug('buttons', () => describeButtons(buttons));
    const btn = again.bg;
    registerDebug('againButton', () => ({ x: btn.x, y: btn.y }));
  }
}

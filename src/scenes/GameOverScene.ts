import * as Phaser from 'phaser';
import { relayoutOnResize } from '../game/ui';
import { addRunResult } from '../logic/save';
import { storage } from '../platform/storage';
import { audio } from '../audio';
import { describeButtons, makeButton } from '../ui/button';
import { DRAGON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import type { FormId } from '../logic/types';

export interface GameOverData { time: number; level: number; formId: FormId; gold: number; won: boolean; runId: number; forms: FormId[]; banked: number }

/** Runs already added to the save: rebuilding this screen (e.g. on rotation) must not add the gold twice. */
const savedRuns = new Set<number>();

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

import { TEXT } from '../ui/style';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GameOverData): void {
    relayoutOnResize(this, data);
    if (!savedRuns.has(data.runId)) {
      savedRuns.add(data.runId);
      audio.play(data.won ? 'victory' : 'defeat');
      storage.save(addRunResult(storage.load(), { gold: data.gold - data.banked, time: data.time, won: data.won, forms: data.forms }));
    }
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setOrigin(0);
    this.add.text(w / 2, h * 0.16, t(data.won ? 'victory' : 'game_over'), { ...TEXT, fontSize: '16px', color: data.won ? '#f2c230' : '#ffffff' }).setOrigin(0.5);
    registerDebug('gameOver', () => ({ ...data }));
    this.add.sprite(w / 2, h * 0.36, DRAGON_SHEETS[data.formId].key).play(`${DRAGON_SHEETS[data.formId].key}_loop`).setScale(2);
    const lines = [`${t('time')}: ${formatTime(data.time)}`, t('level_n', { n: data.level }), `${t('gold')}: ${data.gold}`];
    this.add.text(w / 2, h * 0.56, lines.join('\n'), { ...TEXT, fontSize: '8px', align: 'center' }).setOrigin(0.5);

    const btnY = h * 0.76;
    const again = makeButton(this, 'again', w / 2, btnY, 130, 30, t('again'), 0xe8542a, () => this.scene.start('Game'));
    const lair = makeButton(this, 'lair', w / 2 - 58, btnY + 38, 100, 22, t('lair'), 0x5a3f8f, () => this.scene.start('Lair'), '8px');
    const menu = makeButton(this, 'menu', w / 2 + 58, btnY + 38, 100, 22, t('menu'), 0x5a3f8f, () => this.scene.start('Menu'), '8px');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game'));
    registerDebug('buttons', () => describeButtons([again, lair, menu]));
    const btn = again.bg;
    registerDebug('againButton', () => ({ x: btn.x, y: btn.y }));
  }
}

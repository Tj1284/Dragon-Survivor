import * as Phaser from 'phaser';
import { onTap } from '../game/ui';
import { DRAGON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import type { FormId } from '../logic/types';

export interface GameOverData { time: number; level: number; formId: FormId; gold: number }

export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const TEXT = { fontFamily: 'monospace', color: '#ffffff', resolution: 4 } as const;

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data: GameOverData): void {
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x000000, 0.75).setOrigin(0);
    this.add.text(w / 2, h * 0.16, t('game_over'), { ...TEXT, fontSize: '18px' }).setOrigin(0.5);
    this.add.sprite(w / 2, h * 0.36, DRAGON_SHEETS[data.formId].key).play(`${DRAGON_SHEETS[data.formId].key}_loop`).setScale(2);
    const lines = [`${t('time')}: ${formatTime(data.time)}`, t('level_n', { n: data.level }), `${t('gold')}: ${data.gold}`];
    this.add.text(w / 2, h * 0.56, lines.join('\n'), { ...TEXT, fontSize: '10px', align: 'center' }).setOrigin(0.5);

    const btnY = h * 0.8;
    const btn = this.add.rectangle(w / 2, btnY, 120, 32, 0xe8542a).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, t('again'), { ...TEXT, fontSize: '14px' }).setOrigin(0.5);
    const again = () => this.scene.start('Game');
    onTap(btn, again);
    this.input.keyboard?.once('keydown-ENTER', again);
    this.input.keyboard?.once('keydown-SPACE', again);
    registerDebug('againButton', () => ({ x: btn.x, y: btn.y }));
  }
}

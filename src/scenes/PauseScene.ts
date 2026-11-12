import * as Phaser from 'phaser';
import { registerDebug } from '../debug';
import { t } from '../i18n';

const TEXT = { fontFamily: 'monospace', color: '#ffffff', resolution: 4 } as const;

export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  create(): void {
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0);
    this.add.text(w / 2, h * 0.35, t('paused'), { ...TEXT, fontSize: '18px' }).setOrigin(0.5);
    const btn = this.add.rectangle(w / 2, h * 0.6, 130, 32, 0x6cc6f0).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, h * 0.6, t('resume'), { ...TEXT, fontSize: '14px', color: '#10202a' }).setOrigin(0.5);
    const resume = () => { this.scene.stop(); this.scene.resume('Game'); };
    btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, resume);
    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-P', resume);
    registerDebug('resumeButton', () => ({ x: btn.x, y: btn.y }));
  }
}

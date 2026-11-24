import * as Phaser from 'phaser';
import { relayoutOnResize } from '../game/ui';
import { describeButtons, makeButton } from '../ui/button';
import { QUIT_EVENT } from './GameScene';
import { audio } from '../audio';
import { toggleMute } from '../audio/mute';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import { platform } from '../platform/bridge';

import { TEXT } from '../ui/style';
import { panel } from '../ui/kit';

export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  create(): void {
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x0e0c18, 0.65).setOrigin(0);
    const cy = h / 2;
    panel(this, w / 2, cy, Math.min(220, w - 20), 150);
    this.add.text(w / 2, cy - 52, t('paused'), { ...TEXT, fontSize: '16px', color: '#f2c230', stroke: '#2a1608', strokeThickness: 4 }).setOrigin(0.5);
    const resume = () => { this.scene.stop(); this.scene.resume('Game'); platform.message('level_resumed'); };
    const res = makeButton(this, 'resume', w / 2, cy - 14, 160, 30, t('resume'), 0x3a8ac0, resume, '16px', 'play');
    this.input.keyboard?.once('keydown-P', resume);
    let quitting = false;
    const menu = makeButton(this, 'menu', w / 2, cy + 24, 160, 22, t('menu'), 0x5a3f8f, () => {
      if (quitting) return;
      quitting = true;
      void platform.interstitial('quit').then(() => this.game.events.emit(QUIT_EVENT));
    }, '8px', 'back');
    registerDebug('resumeButton', () => ({ x: res.bg.x, y: res.bg.y }));
    const mute = makeButton(this, 'mute', w / 2, cy + 52, 160, 22, t(audio.muted ? 'sound_off' : 'sound_on'), 0x3a4a6a, () => {
      const muted = toggleMute();
      mute.label.setText(t(muted ? 'sound_off' : 'sound_on'));
      mute.icon?.setFrame(muted ? 4 : 3);
    }, '8px', audio.muted ? 'muted' : 'sound');
    registerDebug('buttons', () => describeButtons([res, menu, mute]));
  }
}

import * as Phaser from 'phaser';
import { COLORS, DRAGON_SHEETS, GROUND } from '../assets/manifest';
import { registerDebug, setDebugReady } from '../debug';
import { relayoutOnResize } from '../game/ui';
import { t } from '../i18n';
import { ALL_FORMS } from '../logic/evolution';
import { storage } from '../platform/storage';
import { describeButtons, makeButton, type Button } from '../ui/button';
import { TEXT } from '../ui/style';
import { hideLoading } from '../ui/loading';
import { audio } from '../audio';
import { toggleMute } from '../audio/mute';

/** Title screen: play, Lair, Collection, gold. Players reach it from their second visit on. */
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    relayoutOnResize(this);
    const save = storage.load();
    const { width: w, height: h } = this.scale.gameSize;
    const landscape = w >= h;
    this.add.tileSprite(0, 0, w, h, GROUND.key).setOrigin(0);
    this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(w, h);
    this.add.rectangle(0, 0, w, h, 0x0e0c18, 0.35).setOrigin(0);

    this.add.text(w / 2, landscape ? 40 : 70, 'DRAGON\nSURVIVOR', { ...TEXT, fontSize: '16px', align: 'center', color: '#f2c230', stroke: '#2a1608', strokeThickness: 4 })
      .setOrigin(0.5).setScale(landscape ? 1.5 : 2);
    this.add.text(w - 8, 8, `● ${save.gold}`, { ...TEXT, fontSize: '8px', color: '#f2c230' }).setOrigin(1, 0);

    const dragonY = landscape ? h * 0.47 : h * 0.4;
    this.add.image(w / 2, dragonY, 'glow').setTint(COLORS.neutral).setAlpha(0.35).setScale(1.6);
    const dragon = this.add.sprite(w / 2, dragonY, DRAGON_SHEETS.hatchling.key).play(`${DRAGON_SHEETS.hatchling.key}_loop`).setScale(3);
    this.tweens.add({ targets: dragon, y: dragonY - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const buttons: Button[] = [];
    const playY = landscape ? h * 0.72 : h * 0.66;
    buttons.push(makeButton(this, 'play', w / 2, playY, 150, 34, t('play'), COLORS.fire, () => this.scene.start('Game')));
    const smallY = playY + (landscape ? 38 : 48);
    const gap = landscape ? 62 : 0;
    const lairX = landscape ? w / 2 - gap : w / 2;
    const colX = landscape ? w / 2 + gap : w / 2;
    buttons.push(makeButton(this, 'lair', lairX, smallY, 112, 26, t('lair'), 0x5a3f8f, () => this.scene.start('Lair'), '8px'));
    buttons.push(makeButton(this, 'collection', colX, landscape ? smallY : smallY + 34, 112, 26,
      `${t('collection')} ${save.collection.length}/${ALL_FORMS.length}`, 0x5a3f8f, () => this.scene.start('Collection'), '8px'));

    const mute = makeButton(this, 'mute', 34, 18, 56, 20, t(audio.muted ? 'sound_off' : 'sound_on'), 0x3a4a6a, () => {
      mute.label.setText(t(toggleMute() ? 'sound_off' : 'sound_on'));
    }, '8px');
    buttons.push(mute);
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
    registerDebug('buttons', () => describeButtons(buttons));
    setDebugReady(true);
    hideLoading();
  }
}

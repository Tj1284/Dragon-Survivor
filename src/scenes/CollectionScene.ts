import * as Phaser from 'phaser';
import { DRAGON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { relayoutOnResize } from '../game/ui';
import { t } from '../i18n';
import { ALL_FORMS } from '../logic/evolution';
import { storage } from '../platform/storage';
import { describeButtons, makeButton } from '../ui/button';
import { TEXT } from '../ui/style';

/** Every dragon form: reached ones in colour, the rest as black silhouettes. */
export class CollectionScene extends Phaser.Scene {
  constructor() { super('Collection'); }

  create(): void {
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    const owned = new Set(storage.load().collection);
    this.add.rectangle(0, 0, w, h, 0x1d1b2a).setOrigin(0);
    this.add.text(w / 2, 14, `${t('collection')} ${owned.size}/${ALL_FORMS.length}`, { ...TEXT, fontSize: '16px', color: '#f2c230' }).setOrigin(0.5);

    const cols = w >= h ? 8 : 4;
    const cell = Math.min(80, (w - 16) / cols, (h - 70) / Math.ceil(ALL_FORMS.length / cols));
    const rows = Math.ceil(ALL_FORMS.length / cols);
    const top = 34 + (h - 70 - rows * cell) / 2;
    ALL_FORMS.forEach((id, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = w / 2 + (c - (cols - 1) / 2) * cell, y = top + r * cell + cell / 2;
      this.add.rectangle(x, y, cell - 6, cell - 6, 0x2a2638).setStrokeStyle(1, owned.has(id) ? 0xf2c230 : 0x5a5470);
      const def = DRAGON_SHEETS[id];
      const sprite = this.add.sprite(x, y, def.key, 0).setScale(Math.min(2, (cell - 14) / def.frameWidth));
      if (owned.has(id)) sprite.play(`${def.key}_loop`);
      else sprite.setTint(0x000000);
    });
    const back = makeButton(this, 'back', w / 2, h - 16, 100, 22, t('back'), 0x5a3f8f, () => this.scene.start('Menu'), '8px');
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Menu'));
    registerDebug('buttons', () => describeButtons([back]));
    registerDebug('collectionCount', () => owned.size);
  }
}

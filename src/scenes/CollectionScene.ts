import * as Phaser from 'phaser';
import { DRAGON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { relayoutOnResize } from '../game/ui';
import { t } from '../i18n';
import { ALL_FORMS } from '../logic/evolution';
import { storage } from '../platform/storage';
import { describeButtons, makeButton } from '../ui/button';
import { TEXT } from '../ui/style';
import { background, icon, panel } from '../ui/kit';

/** Every dragon form: reached ones in colour, the rest as black silhouettes. */
export class CollectionScene extends Phaser.Scene {
  constructor() { super('Collection'); }

  create(): void {
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    const owned = new Set(storage.load().collection);
    background(this, 0.5, 0.55);
    this.add.text(w / 2, 14, `${t('collection')} ${owned.size}/${ALL_FORMS.length}`, { ...TEXT, fontSize: '16px', color: '#f2c230', stroke: '#2a1608', strokeThickness: 4 }).setOrigin(0.5);

    const cols = w >= h ? 8 : 4;
    const cell = Math.min(80, (w - 16) / cols, (h - 70) / Math.ceil(ALL_FORMS.length / cols));
    const rows = Math.ceil(ALL_FORMS.length / cols);
    const top = 34 + (h - 70 - rows * cell) / 2;
    ALL_FORMS.forEach((id, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const x = w / 2 + (c - (cols - 1) / 2) * cell, y = top + r * cell + cell / 2;
      const frame = panel(this, x, y, cell - 6, cell - 6, owned.has(id) ? 1 : 0.6);
      if (!owned.has(id) && 'setTint' in frame) (frame as Phaser.GameObjects.NineSlice).setTint(0x8a84a0);
      const def = DRAGON_SHEETS[id];
      const sprite = this.add.sprite(x, y, def.key, 0).setScale(Math.min(2, (cell - 14) / def.frameWidth));
      if (owned.has(id)) sprite.play(`${def.key}_loop`);
      else {
        sprite.setTint(0x000000);
        icon(this, x + (cell - 6) / 2 - 8, y + (cell - 6) / 2 - 8, 'lock');
      }
    });
    const back = makeButton(this, 'back', w / 2, h - 16, 100, 22, t('back'), 0x5a3f8f, () => this.scene.start('Menu'), '8px', 'back');
    registerDebug('buttons', () => describeButtons([back]));
    registerDebug('collectionCount', () => owned.size);
  }
}

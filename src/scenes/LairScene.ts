import * as Phaser from 'phaser';
import { ICON_SHEETS, PICKUP_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { relayoutOnResize } from '../game/ui';
import { t } from '../i18n';
import { META, META_IDS, buyMeta, metaCost, type MetaId } from '../logic/meta';
import { storage } from '../platform/storage';
import { describeButtons, makeButton, type Button } from '../ui/button';
import { TEXT } from '../ui/style';

const ICON: Record<MetaId, string> = {
  vitality: ICON_SHEETS.thick_scales.key, might: ICON_SHEETS.fury.key, agility: ICON_SHEETS.swift_wings.key,
  greed: PICKUP_SHEETS.gold.key, wisdom: PICKUP_SHEETS.gem_l.key, reach: ICON_SHEETS.magnet.key,
};

/** The Lair: permanent upgrades bought with the gold kept between runs. */
export class LairScene extends Phaser.Scene {
  private buttons: Button[] = [];
  private gold!: Phaser.GameObjects.Text;
  private levels = new Map<MetaId, Phaser.GameObjects.Text>();

  constructor() { super('Lair'); }

  create(): void {
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    this.buttons = [];
    this.levels.clear();
    this.add.rectangle(0, 0, w, h, 0x1d1b2a).setOrigin(0);
    this.add.text(w / 2, 14, t('lair'), { ...TEXT, fontSize: '16px', color: '#f2c230' }).setOrigin(0.5);
    this.gold = this.add.text(w - 8, 8, '', { ...TEXT, fontSize: '8px', color: '#f2c230' }).setOrigin(1, 0);

    const rowW = Math.min(440, w - 16);
    const narrow = rowW < 360;
    const rowH = Math.min(narrow ? 52 : 36, (h - 70) / META_IDS.length);
    const left = (w - rowW) / 2;
    META_IDS.forEach((id, i) => {
      const y = 36 + i * rowH + rowH / 2;
      // name, description (wrapped) and, on narrow screens, the level on its own line
      this.add.rectangle(w / 2, y, rowW, rowH - 4, 0x2a2638).setStrokeStyle(1, 0x5a5470);
      this.add.image(left + 14, y, ICON[id]).setScale(id === 'greed' || id === 'wisdom' ? 1.6 : 1);
      this.add.text(left + 28, y - (narrow ? 19 : 8), t(`meta_${id}`), { ...TEXT, fontSize: '8px' });
      this.add.text(left + 28, y + (narrow ? -9 : 2), t(`meta_${id}_d`), { ...TEXT, fontSize: '8px', color: '#cfc8e6', wordWrap: { width: rowW - 28 - 90 } });
      this.levels.set(id, narrow
        ? this.add.text(left + 28, y + 15, '', { ...TEXT, fontSize: '8px', color: '#ffd76a' })
        : this.add.text(left + rowW - 92, y - 8, '', { ...TEXT, fontSize: '8px', color: '#ffd76a' }).setOrigin(1, 0));
      this.buttons.push(makeButton(this, `buy_${id}`, left + rowW - 44, y, 76, Math.min(30, rowH - 10), '', 0x2f8f4a, () => this.buy(id), '8px'));
    });
    this.buttons.push(makeButton(this, 'back', w / 2, h - 16, 100, 22, t('back'), 0x5a3f8f, () => this.scene.start('Menu'), '8px'));
    this.refresh();
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Menu'));
    registerDebug('buttons', () => describeButtons(this.buttons));
  }

  private buy(id: MetaId): void {
    const next = buyMeta(storage.load(), id);
    if (!next) return; // not enough gold or already maxed
    storage.save(next);
    this.refresh();
  }

  private refresh(): void {
    const save = storage.load();
    this.gold.setText(`● ${save.gold}`);
    for (const id of META_IDS) {
      const level = save.meta[id] ?? 0;
      const max = META[id].maxLevel;
      this.levels.get(id)!.setText(t('lvl_of', { n: level, max }));
      const button = this.buttons.find((b) => b.id === `buy_${id}`)!;
      if (level >= max) { button.label.setText(t('maxed')); button.setEnabled(false); continue; }
      const cost = metaCost(id, level);
      button.label.setText(`● ${cost}`);
      button.setEnabled(save.gold >= cost);
    }
  }
}

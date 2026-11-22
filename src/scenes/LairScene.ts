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

  constructor() { super('Lair'); }

  create(): void {
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    this.buttons = [];
    this.add.rectangle(0, 0, w, h, 0x1d1b2a).setOrigin(0);
    this.add.text(w / 2, 14, t('lair'), { ...TEXT, fontSize: '16px', color: '#f2c230' }).setOrigin(0.5);
    this.gold = this.add.text(w - 8, 8, '', { ...TEXT, fontSize: '8px', color: '#f2c230' }).setOrigin(1, 0);

    const rowW = Math.min(440, w - 16);
    const rowH = Math.min(40, (h - 70) / META_IDS.length);
    const left = (w - rowW) / 2;
    const rows: { id: MetaId; top: number; bottom: number; texts: Record<string, Phaser.GameObjects.Text> }[] = [];
    META_IDS.forEach((id, i) => {
      const y = 36 + i * rowH + rowH / 2;
      // name and description on the left; the buy button shows the level and the price, so nothing collides on any screen
      this.add.rectangle(w / 2, y, rowW, rowH - 4, 0x2a2638).setStrokeStyle(1, 0x5a5470);
      this.add.image(left + 14, y, ICON[id]).setScale(id === 'greed' || id === 'wisdom' ? 1.6 : 1);
      const name = this.add.text(left + 28, y - 9, t(`meta_${id}`), { ...TEXT, fontSize: '8px' });
      const desc = this.add.text(left + 28, y + 1, t(`meta_${id}_d`), { ...TEXT, fontSize: '8px', color: '#cfc8e6' });
      const button = makeButton(this, `buy_${id}`, left + rowW - 40, y, 72, Math.min(30, rowH - 8), '', 0x2f8f4a, () => this.buy(id), '8px');
      button.label.setLineSpacing(2);
      this.buttons.push(button);
      rows.push({ id, top: y - (rowH - 4) / 2, bottom: y + (rowH - 4) / 2, texts: { name, desc, level: button.label } });
    });
    this.buttons.push(makeButton(this, 'back', w / 2, h - 16, 100, 22, t('back'), 0x5a3f8f, () => this.scene.start('Menu'), '8px'));
    this.refresh();
    registerDebug('buttons', () => describeButtons(this.buttons));
    registerDebug('lairRows', () => rows.map((r) => ({
      id: r.id, top: r.top, bottom: r.bottom,
      texts: Object.fromEntries(Object.entries(r.texts).map(([k, txt]) => [k, { top: txt.getBounds().top, bottom: txt.getBounds().bottom }])),
    })));
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
      const button = this.buttons.find((b) => b.id === `buy_${id}`)!;
      const lvl = t('lvl_of', { n: level, max });
      if (level >= max) { button.label.setText(`${lvl}\n${t('maxed')}`); button.setEnabled(false); continue; }
      const cost = metaCost(id, level);
      button.label.setText(`${lvl}\n● ${cost}`);
      button.setEnabled(save.gold >= cost);
    }
  }
}

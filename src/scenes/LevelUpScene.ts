import * as Phaser from 'phaser';
import { onTap, relayoutOnResize } from '../game/ui';
import { COLORS, ICON_SHEETS } from '../assets/manifest';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import { ELEMENTS, type Element } from '../logic/types';
import { UPGRADE_BY_ID, type Choice, type Owned } from '../logic/upgrades';

export type LevelUpData =
  | { mode: 'upgrade'; choices: Choice[]; owned: Owned }
  | { mode: 'element' };

export const LEVELUP_EVENTS = { picked: 'levelup:picked', element: 'element:picked' } as const;

interface Card { title: string; desc: string; level: string; color: number; icon?: string; onPick: () => void; x?: number; y?: number }

import { TEXT } from '../ui/style';

export class LevelUpScene extends Phaser.Scene {
  private cards: Card[] = [];
  private done = false;

  constructor() { super('LevelUp'); }

  create(data: LevelUpData): void {
    this.done = false;
    relayoutOnResize(this, data);
    this.cards = data.mode === 'upgrade' ? this.upgradeCards(data.choices, data.owned) : this.elementCards();
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0);
    this.add.text(w / 2, 18, data.mode === 'upgrade' ? t('choose_upgrade') : t('choose_element'), { ...TEXT, fontSize: '16px' }).setOrigin(0.5);

    const landscape = w >= h;
    const n = this.cards.length;
    const cw = landscape ? Math.min(140, (w - 24 - (n - 1) * 8) / n) : w - 32;
    const ch = landscape ? Math.min(170, h - 60) : Math.min(90, (h - 60 - (n - 1) * 8) / n);
    this.cards.forEach((card, i) => {
      const cx = landscape ? w / 2 + (i - (n - 1) / 2) * (cw + 8) : w / 2;
      const cy = landscape ? h / 2 + 12 : 40 + ch / 2 + i * (ch + 8);
      this.drawCard(card, i, cx, cy, cw, ch, landscape);
    });

    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      if (ev.repeat) return;
      const idx = Number(ev.key) - 1;
      if (idx >= 0 && idx < this.cards.length) this.pick(idx);
    });
    registerDebug('cards', () => this.cards.map((c) => ({ title: c.title, level: c.level, x: c.x ?? 0, y: c.y ?? 0 })));
    registerDebug('pick', (i: number) => this.pick(i));
  }

  private drawCard(card: Card, i: number, cx: number, cy: number, cw: number, ch: number, landscape: boolean): void {
    card.x = cx; card.y = cy;
    const bg = this.add.rectangle(cx, cy, cw, ch, 0x2a2638).setStrokeStyle(2, card.color).setInteractive({ useHandCursor: true });
    onTap(bg, () => this.pick(i));
    bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => bg.setFillStyle(0x3a3550));
    bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => bg.setFillStyle(0x2a2638));
    const wrap = { width: landscape ? cw - 12 : cw - 70 };
    if (landscape) {
      if (card.icon) this.add.image(cx, cy - ch / 2 + 28, card.icon).setScale(2);
      else this.add.circle(cx, cy - ch / 2 + 28, 12, card.color);
      this.add.text(cx, cy - ch / 2 + 54, card.title, { ...TEXT, fontSize: '8px', align: 'center', wordWrap: wrap }).setOrigin(0.5, 0);
      this.add.text(cx, cy - ch / 2 + 82, card.level, { ...TEXT, fontSize: '8px', color: '#ffd76a' }).setOrigin(0.5, 0);
      this.add.text(cx, cy - ch / 2 + 98, card.desc, { ...TEXT, fontSize: '8px', color: '#cfc8e6', align: 'center', wordWrap: wrap }).setOrigin(0.5, 0);
      this.add.text(cx, cy + ch / 2 - 12, `${i + 1}`, { ...TEXT, fontSize: '8px', color: '#8a84a0' }).setOrigin(0.5);
    } else {
      const left = cx - cw / 2;
      if (card.icon) this.add.image(left + 24, cy, card.icon).setScale(2);
      else this.add.circle(left + 24, cy, 12, card.color);
      this.add.text(left + 48, cy - ch / 2 + 10, card.title, { ...TEXT, fontSize: '8px', wordWrap: wrap });
      this.add.text(cx + cw / 2 - 8, cy - ch / 2 + 10, card.level, { ...TEXT, fontSize: '8px', color: '#ffd76a' }).setOrigin(1, 0);
      this.add.text(left + 48, cy - ch / 2 + 30, card.desc, { ...TEXT, fontSize: '8px', color: '#cfc8e6', wordWrap: wrap });
    }
  }

  private upgradeCards(choices: Choice[], owned: Owned): Card[] {
    return choices.map((c) => {
      if (c.type === 'fallback') {
        return { title: t('fallback'), desc: t('fallback_d'), level: '', color: COLORS.neutral, onPick: () => this.emitPick(c) };
      }
      const def = UPGRADE_BY_ID[c.id];
      const next = (owned[c.id] ?? 0) + 1;
      return {
        title: t(`up_${c.id}`), desc: t(`up_${c.id}_d`), level: next === 1 ? t('new') : t('lvl_short', { n: next }),
        color: COLORS[def.tag], icon: ICON_SHEETS[c.id].key, onPick: () => this.emitPick(c),
      };
    });
  }

  private elementCards(): Card[] {
    return ELEMENTS.map((el: Element) => ({
      title: t(`el_${el}`), desc: t(`el_${el}_d`), level: '', color: COLORS[el],
      onPick: () => this.game.events.emit(LEVELUP_EVENTS.element, el),
    }));
  }

  private emitPick(choice: Choice): void {
    this.game.events.emit(LEVELUP_EVENTS.picked, choice);
  }

  private pick(i: number): void {
    if (this.done || !this.cards[i]) return;
    this.done = true;
    this.cards[i].onPick();
  }
}

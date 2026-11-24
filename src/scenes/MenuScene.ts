import * as Phaser from 'phaser';
import { COLORS, DRAGON_SHEETS, UI } from '../assets/manifest';
import { registerDebug, setDebugReady } from '../debug';
import { relayoutOnResize } from '../game/ui';
import { t } from '../i18n';
import { ALL_FORMS } from '../logic/evolution';
import type { FormId } from '../logic/types';
import { storage } from '../platform/storage';
import { describeButtons, makeButton, type Button } from '../ui/button';
import { background, enter, icon, panel, stars } from '../ui/kit';
import { TEXT } from '../ui/style';
import { hideLoading } from '../ui/loading';
import { formatTime } from './GameOverScene';
import { audio } from '../audio';
import { toggleMute } from '../audio/mute';

const STAGE_RANK = { hatchling: 0, young: 1, adult: 2, legendary: 3 } as const;

/** The most evolved dragon the player has reached: the menu shows it off. */
export function bestForm(collection: readonly FormId[]): FormId {
  let best: FormId = 'hatchling';
  for (const f of collection) if (STAGE_RANK[f.split('_')[0] as keyof typeof STAGE_RANK] > STAGE_RANK[best.split('_')[0] as keyof typeof STAGE_RANK]) best = f;
  return best;
}

/** Title screen: play, Lair, Collection, gold. Players reach it from their second visit on. */
export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create(): void {
    relayoutOnResize(this);
    const save = storage.load();
    const { width: w, height: h } = this.scale.gameSize;
    const landscape = w >= h;
    background(this, landscape ? 0.5 : 0.62, 0.1);
    stars(this, landscape ? 24 : 30, landscape ? h * 0.35 : h * 0.3);

    // logo with a slow glow
    const logoY = landscape ? (w < 420 ? 48 : 26) : Math.round(h * 0.11);
    const logo = this.textures.exists(UI.logo.key)
      ? this.add.image(w / 2, logoY, UI.logo.key)
      : this.add.text(w / 2, logoY, 'DRAGON SURVIVOR', { ...TEXT, fontSize: '16px', color: '#f2c230', stroke: '#2a1608', strokeThickness: 4 }).setOrigin(0.5);
    if (logo instanceof Phaser.GameObjects.Image) {
      const glow = this.add.image(w / 2, logoY, UI.logo.key).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      this.tweens.add({ targets: glow, alpha: 0.35, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // gold, top right
    const goldText = this.add.text(w - 10, 14, String(save.gold), { ...TEXT, fontSize: '8px', color: '#f2c230' }).setOrigin(1, 0.5);
    const goldW = Math.max(56, goldText.width + 30);
    panel(this, w - 6 - goldW / 2, 14, goldW, 20);
    this.children.bringToTop(goldText);
    icon(this, w - 6 - goldW + 12, 14, 'coin');

    // the best dragon reached, flying over a soft light
    const form = bestForm(save.collection);
    const def = DRAGON_SHEETS[form];
    const scale = landscape && def.frameHeight >= 64 ? 1 : 2;
    const dragonY = landscape ? Math.round(h * 0.4) : Math.round(h * 0.4);
    this.add.image(w / 2, dragonY + def.frameHeight * scale * 0.42, 'glow').setTint(0xd8ff7a).setAlpha(0.35).setScale(1.3, 0.28);
    const dragon = this.add.sprite(w / 2, dragonY, def.key).play(`${def.key}_loop`).setScale(scale);
    this.tweens.add({ targets: dragon, y: dragonY - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // buttons
    const buttons: Button[] = [];
    const play = makeButton(this, 'play', w / 2, landscape ? Math.round(h * 0.67) : Math.round(h * 0.64), 170, landscape ? 30 : 34, t('play'), COLORS.fire, () => this.scene.start('Game'), '16px', 'play');
    const colLabel = `${t('collection')} ${save.collection.length}/${ALL_FORMS.length}`;
    let lair: Button, col: Button;
    if (landscape) {
      const bw = Math.min(150, (w - 24) / 2 - 4), y = Math.round(h * 0.67) + 34;
      lair = makeButton(this, 'lair', w / 2 - bw / 2 - 4, y, bw, 24, t('lair'), 0x5a3f8f, () => this.scene.start('Lair'), '8px', 'lair');
      col = makeButton(this, 'collection', w / 2 + bw / 2 + 4, y, bw, 24, colLabel, 0x5a3f8f, () => this.scene.start('Collection'), '8px', 'book');
    } else {
      const y = Math.round(h * 0.64) + 44;
      lair = makeButton(this, 'lair', w / 2, y, 160, 26, t('lair'), 0x5a3f8f, () => this.scene.start('Lair'), '8px', 'lair');
      col = makeButton(this, 'collection', w / 2, y + 34, 160, 26, colLabel, 0x5a3f8f, () => this.scene.start('Collection'), '8px', 'book');
    }
    buttons.push(play, lair, col);

    // best time and wins, bottom left; sound, bottom right
    const statsText = this.add.text(14, h - 12, `${t('best')} ${formatTime(save.bestTime)} · ${t('wins')} ${save.wins}`, { ...TEXT, fontSize: '8px', color: '#cfc8e6' }).setOrigin(0, 0.5);
    panel(this, 6 + (statsText.width + 16) / 2, h - 12, statsText.width + 16, 18);
    this.children.bringToTop(statsText);
    const mute = makeButton(this, 'mute', w - 18, h - 14, 26, 22, '', 0x3a4a6a, () => {
      const muted = toggleMute();
      mute.icon?.setFrame(muted ? 4 : 3);
    }, '8px', audio.muted ? 'muted' : 'sound');
    buttons.push(mute);

    enter(this, [[dragon], [play.bg, play.label, ...(play.icon ? [play.icon] : [])], [lair.bg, lair.label, ...(lair.icon ? [lair.icon] : [])], [col.bg, col.label, ...(col.icon ? [col.icon] : [])]]);

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
    registerDebug('buttons', () => describeButtons(buttons));
    registerDebug('menuDragon', () => form);
    setDebugReady(true);
    hideLoading();
    audio.playMusic('title');
  }
}

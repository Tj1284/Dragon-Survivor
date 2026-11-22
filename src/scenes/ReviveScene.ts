import * as Phaser from 'phaser';
import { relayoutOnResize } from '../game/ui';
import { registerDebug } from '../debug';
import { t } from '../i18n';
import { platform } from '../platform/bridge';
import { describeButtons, makeButton } from '../ui/button';
import { TEXT } from '../ui/style';

export const REVIVE_EVENTS = { yes: 'revive:yes', no: 'revive:no' } as const;

/** Offered once per run when the dragon falls: watch a rewarded ad to come back, or end the run. */
export class ReviveScene extends Phaser.Scene {
  private busy = false;
  /** Set once the player has decided (or the ad paid out): late ad results are then ignored. */
  private settled = false;

  constructor() { super('Revive'); }

  create(): void {
    this.busy = false;
    this.settled = false;
    relayoutOnResize(this);
    const { width: w, height: h } = this.scale.gameSize;
    this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0);
    this.add.text(w / 2, h * 0.3, t('revive_title'), { ...TEXT, fontSize: '16px', color: '#f2c230' }).setOrigin(0.5);
    const status = this.add.text(w / 2, h * 0.42, '', { ...TEXT, fontSize: '8px', color: '#ff8a8a' }).setOrigin(0.5);
    const yes = makeButton(this, 'revive', w / 2, h * 0.56, 170, 30, t('revive_ad'), 0x3a9a4a, () => {
      if (this.busy) return;
      this.busy = true;
      status.setText('');
      void platform.rewarded('revive').then((ok) => {
        if (this.settled) return;
        this.busy = false;
        if (ok) this.finish(REVIVE_EVENTS.yes);
        else if (status.active) status.setText(t('ad_failed'));
      });
    }, '8px');
    const no = makeButton(this, 'no', w / 2, h * 0.56 + 40, 120, 22, t('revive_no'), 0x5a3f8f, () => this.finish(REVIVE_EVENTS.no), '8px');
    registerDebug('buttons', () => describeButtons([yes, no]));
  }

  /** The player can always decline, even while an ad is pending (Playgama 2.2.2). */
  private finish(event: string): void {
    if (this.settled) return;
    this.settled = true;
    this.scene.stop();
    this.game.events.emit(event);
  }
}

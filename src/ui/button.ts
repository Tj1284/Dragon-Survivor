import * as Phaser from 'phaser';
import { onTap } from '../game/ui';
import { TEXT } from './style';
import { audio } from '../audio';
import { UI, type ICON } from '../assets/manifest';
import { buttonTint, hasUi, icon as addIcon } from './kit';

export interface Button {
  id: string;
  bg: Phaser.GameObjects.Rectangle | Phaser.GameObjects.NineSlice;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Image | null;
  enabled: boolean;
  setEnabled(on: boolean): void;
}

const DISABLED = 0x4a4658;

/**
 * Pixel-style button: solid fill, light 2 px border, hard shadow below.
 * Taps only count when they start and end on the button (onTap), and disabled buttons ignore them.
 */
export function makeButton(
  scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number,
  text: string, color: number, onPress: () => void, fontSize: '8px' | '16px' = '16px', iconName?: keyof typeof ICON,
): Button {
  if (!hasUi(scene)) return plainButton(scene, id, x, y, w, h, text, color, onPress, fontSize);
  const bg = scene.add.nineslice(x, y, UI.button.key, 0, w, h, 5, 5, 4, 5).setTint(buttonTint(color)).setInteractive({ useHandCursor: true });
  const stroke = { stroke: '#1a1226', strokeThickness: fontSize === '16px' ? 4 : 2 };
  const ic = iconName ? addIcon(scene, 0, y, iconName) : null;
  const label = scene.add.text(x, y, text, { ...TEXT, fontSize, align: 'center', ...stroke }).setOrigin(0.5);
  if (ic) {
    const total = 16 + 4 + label.width;
    ic.setX(Math.round(x - total / 2 + 8));
    label.setX(Math.round(x - total / 2 + 20 + label.width / 2));
  }
  const parts = ic ? [label, ic] : [label];
  const baseY = parts.map((p) => p.y);
  const press = (down: boolean) => {
    bg.setFrame(down ? 2 : 0);
    parts.forEach((p, i) => p.setY(baseY[i] + (down ? 1 : 0)));
  };
  bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => { if (button.enabled) press(true); });
  bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => press(false));
  bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => press(false));
  bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => { if (button.enabled) bg.setFrame(1); });
  const button: Button = {
    id, bg, label, icon: ic, enabled: true,
    setEnabled(on) {
      button.enabled = on;
      bg.setTint(on ? buttonTint(color) : DISABLED);
      label.setAlpha(on ? 1 : 0.55);
      ic?.setAlpha(on ? 1 : 0.55);
    },
  };
  onTap(bg, () => { if (!button.enabled) return; audio.play('click'); onPress(); });
  return button;
}

/** The old flat button, used when the interface art is missing. */
function plainButton(
  scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number,
  text: string, color: number, onPress: () => void, fontSize: '8px' | '16px',
): Button {
  scene.add.rectangle(x, y + 3, w, h, 0x000000, 0.45);
  const bg = scene.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, text, { ...TEXT, fontSize, align: 'center' }).setOrigin(0.5);
  const button: Button = {
    id, bg, label, icon: null, enabled: true,
    setEnabled(on) {
      button.enabled = on;
      bg.setFillStyle(on ? color : DISABLED).setStrokeStyle(2, 0xffffff, on ? 0.9 : 0.35);
      label.setAlpha(on ? 1 : 0.55);
    },
  };
  onTap(bg, () => { if (!button.enabled) return; audio.play('click'); onPress(); });
  return button;
}

export function describeButtons(buttons: readonly Button[]): { id: string; x: number; y: number; enabled: boolean }[] {
  return buttons.map((b) => ({ id: b.id, x: b.bg.x, y: b.bg.y, enabled: b.enabled }));
}

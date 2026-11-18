import type * as Phaser from 'phaser';
import { onTap } from '../game/ui';
import { TEXT } from './style';

export interface Button {
  id: string;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
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
  text: string, color: number, onPress: () => void, fontSize: '8px' | '16px' = '16px',
): Button {
  scene.add.rectangle(x, y + 3, w, h, 0x000000, 0.45);
  const bg = scene.add.rectangle(x, y, w, h, color).setStrokeStyle(2, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, text, { ...TEXT, fontSize, align: 'center' }).setOrigin(0.5);
  const button: Button = {
    id, bg, label, enabled: true,
    setEnabled(on) {
      button.enabled = on;
      bg.setFillStyle(on ? color : DISABLED).setStrokeStyle(2, 0xffffff, on ? 0.9 : 0.35);
      label.setAlpha(on ? 1 : 0.55);
    },
  };
  onTap(bg, () => { if (button.enabled) onPress(); });
  return button;
}

export function describeButtons(buttons: readonly Button[]): { id: string; x: number; y: number; enabled: boolean }[] {
  return buttons.map((b) => ({ id: b.id, x: b.bg.x, y: b.bg.y, enabled: b.enabled }));
}

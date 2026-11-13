import * as Phaser from 'phaser';
import { createJoystick, drag, joystickVector, press, release, type JoystickState } from '../logic/joystick';

const MAX_RADIUS = 32;

/** Keyboard (WASD/arrows) + floating touch joystick. The joystick wins while active. */
export class InputController {
  readonly joystick: JoystickState = createJoystick();
  private readonly keys: Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', Phaser.Input.Keyboard.Key>;
  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private readonly onVisibility = () => { if (document.hidden) this.releaseAll(); };
  private readonly onBlur = () => this.releaseAll();

  constructor(private readonly scene: Phaser.Scene) {
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as InputController['keys'];
    this.base = scene.add.circle(0, 0, MAX_RADIUS, 0xffffff, 0.12).setStrokeStyle(1, 0xffffff, 0.35).setScrollFactor(0).setDepth(1000).setVisible(false);
    this.knob = scene.add.circle(0, 0, 10, 0xffffff, 0.35).setScrollFactor(0).setDepth(1001).setVisible(false);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return; // tapped a UI element
      press(this.joystick, p.x, p.y);
    });
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => { if (p.isDown) drag(this.joystick, p.x, p.y); });
    scene.input.on(Phaser.Input.Events.POINTER_UP, () => release(this.joystick));
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, () => release(this.joystick));
    scene.game.events.on(Phaser.Core.Events.BLUR, this.onBlur);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  releaseAll(): void {
    release(this.joystick);
    this.scene.input.keyboard?.resetKeys();
  }

  moveVector(): { x: number; y: number } {
    const j = this.joystick;
    this.base.setVisible(j.active).setPosition(j.ox, j.oy);
    if (j.active) {
      const v = joystickVector(j);
      this.knob.setVisible(true).setPosition(j.ox + v.x * MAX_RADIUS, j.oy + v.y * MAX_RADIUS);
      return v;
    }
    this.knob.setVisible(false);
    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const y = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  destroy(): void {
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.onBlur);
    this.scene.game.events.off(Phaser.Core.Events.HIDDEN, this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
}

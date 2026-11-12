import * as Phaser from 'phaser';

/**
 * Fires `handler` only when a pointer is pressed AND released on `obj`.
 * A finger already down when the button appeared (e.g. holding the joystick) can't trigger it by lifting.
 */
export function onTap(obj: Phaser.GameObjects.GameObject, handler: () => void): void {
  const armed = new Set<number>();
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => armed.add(p.id));
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, (p: Phaser.Input.Pointer) => armed.delete(p.id));
  obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, (p: Phaser.Input.Pointer) => { if (armed.delete(p.id)) handler(); });
}

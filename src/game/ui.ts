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

/** Overlay scenes lay out once from the game size; rebuild them when the screen is rotated or resized. */
export function relayoutOnResize(scene: Phaser.Scene, data?: object): void {
  const onResize = () => scene.scene.restart(data);
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
}

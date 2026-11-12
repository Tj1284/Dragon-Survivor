import * as Phaser from 'phaser';
import { GROUND } from '../assets/manifest';
import { registerDebug, setDebugReady } from '../debug';
import { InputController } from '../game/InputController';
import { Player } from '../game/Player';
import { clampDelta } from '../logic/time';

export class GameScene extends Phaser.Scene {
  player!: Player;
  inputCtl!: InputController;
  ground!: Phaser.GameObjects.TileSprite;
  now = 0;

  constructor() { super('Game'); }

  create(): void {
    this.now = 0;
    const { width, height } = this.scale.gameSize;
    this.ground = this.add.tileSprite(0, 0, width, height, GROUND.key).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.player = new Player(this, 0, 0);
    this.cameras.main.startFollow(this.player.sprite, true);
    this.inputCtl = new InputController(this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.inputCtl.destroy();
    });
    this.registerDebugCommands();
    setDebugReady(true);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.ground.setSize(size.width, size.height);
  }

  private registerDebugCommands(): void {
    registerDebug('player', () => ({ x: this.player.x, y: this.player.y, hp: this.player.hp, maxHp: this.player.stats.maxHp, formId: this.player.formId }));
    registerDebug('joystick', () => ({ ...this.inputCtl.joystick }));
    registerDebug('blur', () => this.game.events.emit(Phaser.Core.Events.BLUR));
  }

  update(_time: number, delta: number): void {
    const dt = clampDelta(delta) / 1000;
    this.now += dt;
    this.player.update(dt, this.inputCtl.moveVector(), this.now);
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
  }
}

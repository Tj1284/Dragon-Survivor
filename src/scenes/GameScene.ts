import * as Phaser from 'phaser';
import { GROUND } from '../assets/manifest';
import { ENEMY_IDS, type EnemyTypeId } from '../config/balance';
import { registerDebug, setDebugReady } from '../debug';
import { EnemyManager } from '../game/EnemyManager';
import { InputController } from '../game/InputController';
import { Player } from '../game/Player';
import { Projectiles } from '../game/Projectiles';
import { createRng } from '../logic/rng';
import { clampDelta } from '../logic/time';
import type { GameOverData } from './GameOverScene';

export class GameScene extends Phaser.Scene {
  player!: Player;
  inputCtl!: InputController;
  ground!: Phaser.GameObjects.TileSprite;
  enemies!: EnemyManager;
  projectiles!: Projectiles;
  now = 0;
  elapsed = 0;
  level = 1;
  gold = 0;
  private ended = false;

  constructor() { super('Game'); }

  create(): void {
    this.now = 0;
    this.elapsed = 0;
    this.level = 1;
    this.gold = 0;
    this.ended = false;
    const { width, height } = this.scale.gameSize;
    this.ground = this.add.tileSprite(0, 0, width, height, GROUND.key).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.player = new Player(this, 0, 0);
    this.cameras.main.startFollow(this.player.sprite, true);
    this.inputCtl = new InputController(this);
    const rng = createRng((Math.random() * 2 ** 31) | 0);
    this.enemies = new EnemyManager(this, rng);
    this.projectiles = new Projectiles(this);
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
    registerDebug('player', () => ({ x: this.player.x, y: this.player.y, hp: this.player.hp, maxHp: this.player.stats.maxHp, formId: this.player.formId, level: this.level }));
    registerDebug('joystick', () => ({ ...this.inputCtl.joystick }));
    registerDebug('blur', () => this.game.events.emit(Phaser.Core.Events.BLUR));
    registerDebug('pauseSpawns', (paused: boolean) => { this.enemies.spawningPaused = paused; });
    registerDebug('spawn', (type: EnemyTypeId, n: number, dist = 40) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.enemies.spawn(type, this.player.x + Math.cos(a) * dist, this.player.y + Math.sin(a) * dist, this.elapsed);
      }
    });
    registerDebug('enemies', () => this.enemies.active.filter((e) => e.alive).length);
    registerDebug('enemyTypes', () => ENEMY_IDS.filter((id) => this.enemies.active.some((e) => e.alive && e.type === id)));
    registerDebug('setHp', (hp: number) => { this.player.hp = hp; });
    registerDebug('setElapsed', (s: number) => { this.elapsed = s; });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = clampDelta(delta) / 1000;
    this.now += dt;
    this.elapsed += dt;
    this.player.update(dt, this.inputCtl.moveVector(), this.now);
    this.enemies.update(dt, this.now, this.elapsed, this.player, this.projectiles);
    this.projectiles.update(dt, this.enemies, this.player, this.now);
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    if (this.player.hp <= 0) this.endRun();
  }

  private endRun(): void {
    this.ended = true;
    const data: GameOverData = { time: this.elapsed, level: this.level, formId: this.player.formId, gold: this.gold };
    this.scene.start('GameOver', data);
  }
}

import * as Phaser from 'phaser';
import { GROUND } from '../assets/manifest';
import { ENEMIES, ENEMY_IDS, PICKUPS, type EnemyTypeId } from '../config/balance';
import { registerDebug, setDebugReady } from '../debug';
import { EnemyManager } from '../game/EnemyManager';
import { InputController } from '../game/InputController';
import { Pickups } from '../game/Pickups';
import { Player } from '../game/Player';
import { Projectiles } from '../game/Projectiles';
import { createRunState, type RunState } from '../game/RunState';
import { Spit } from '../game/weapons/Spit';
import type { Weapon, WeaponCtx } from '../game/weapons/types';
import { createRng } from '../logic/rng';
import { computeStats, FALLBACK } from '../logic/stats';
import { clampDelta } from '../logic/time';
import { UPGRADE_BY_ID, rollChoices, type Choice } from '../logic/upgrades';
import { applyXp } from '../logic/xp';
import type { GameOverData } from './GameOverScene';
import { LEVELUP_EVENTS, type LevelUpData } from './LevelUpScene';

export class GameScene extends Phaser.Scene {
  player!: Player;
  inputCtl!: InputController;
  ground!: Phaser.GameObjects.TileSprite;
  enemies!: EnemyManager;
  projectiles!: Projectiles;
  pickups!: Pickups;
  run!: RunState;
  weapons: Weapon[] = [];
  ctx!: WeaponCtx;
  rng!: () => number;
  now = 0;
  private ended = false;
  private levelUpOpen = false;

  constructor() { super('Game'); }

  create(): void {
    this.now = 0;
    this.ended = false;
    this.levelUpOpen = false;
    this.run = createRunState();
    const { width, height } = this.scale.gameSize;
    this.ground = this.add.tileSprite(0, 0, width, height, GROUND.key).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.player = new Player(this, 0, 0);
    this.cameras.main.startFollow(this.player.sprite, true);
    this.inputCtl = new InputController(this);
    this.rng = createRng((Math.random() * 2 ** 31) | 0);
    this.enemies = new EnemyManager(this, this.rng);
    this.projectiles = new Projectiles(this);
    this.pickups = new Pickups(this);
    this.ctx = { scene: this, player: this.player, enemies: this.enemies, projectiles: this.projectiles, run: this.run };
    this.weapons = [new Spit(this.ctx)];
    this.enemies.onKilled = (e) => {
      this.pickups.dropGem(e.x, e.y, ENEMIES[e.type].xp);
      if (this.rng() < PICKUPS.goldChance) this.pickups.dropGold(e.x, e.y);
    };

    this.game.events.on(LEVELUP_EVENTS.picked, this.onUpgradePicked, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(LEVELUP_EVENTS.picked, this.onUpgradePicked, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.inputCtl.destroy();
      for (const w of this.weapons) w.destroy();
    });
    this.registerDebugCommands();
    setDebugReady(true);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.ground.setSize(size.width, size.height);
  }

  // ---- experience and level-ups ----

  gainXp(n: number): void {
    const r = applyXp(this.run, n);
    this.run.level = r.level;
    this.run.xp = r.xp;
    this.run.pendingLevels += r.levelsGained;
    if (r.levelsGained > 0) this.openNextLevelUp();
  }

  private openNextLevelUp(): void {
    if (this.levelUpOpen || this.ended) return;
    if (this.run.pendingLevels <= 0) { void this.afterLevelResolved(); return; }
    this.levelUpOpen = true;
    this.inputCtl.releaseAll();
    const data: LevelUpData = { mode: 'upgrade', choices: rollChoices({ owned: this.run.owned, element: this.run.element }, this.rng), owned: this.run.owned };
    this.scene.pause();
    this.scene.launch('LevelUp', data);
  }

  private onUpgradePicked(choice: Choice): void {
    this.scene.stop('LevelUp');
    this.applyChoice(choice);
    this.run.pendingLevels--;
    this.levelUpOpen = false;
    if (this.run.pendingLevels > 0) { this.openNextLevelUp(); return; }
    void this.afterLevelResolved();
  }

  applyChoice(choice: Choice): void {
    if (choice.type === 'fallback') {
      this.player.hp = Math.min(this.player.stats.maxHp, this.player.hp + FALLBACK.healFraction * this.player.stats.maxHp);
      this.run.gold += FALLBACK.gold;
      return;
    }
    this.run.owned[choice.id] = (this.run.owned[choice.id] ?? 0) + 1;
    this.run.picks.push(UPGRADE_BY_ID[choice.id].tag);
    this.refreshStats();
    this.onUpgradeApplied(choice.id);
  }

  /** Hook for weapons granted by upgrades (Task 10). */
  protected onUpgradeApplied(_id: string): void {}

  /** Runs once every pending level is resolved; evolution hooks in here (Task 10). */
  protected async afterLevelResolved(): Promise<void> {
    if (this.scene.isPaused()) this.scene.resume();
  }

  refreshStats(): void {
    const before = this.player.stats.maxHp;
    this.player.stats = computeStats(this.run.stage, this.run.owned);
    const gained = this.player.stats.maxHp - before;
    if (gained > 0) this.player.hp += gained;
    this.player.hp = Math.min(this.player.hp, this.player.stats.maxHp);
  }

  // ---- debug ----

  private registerDebugCommands(): void {
    registerDebug('player', () => ({ x: this.player.x, y: this.player.y, hp: this.player.hp, maxHp: this.player.stats.maxHp, formId: this.player.formId, level: this.run.level, element: this.run.element }));
    registerDebug('run', () => JSON.parse(JSON.stringify(this.run)));
    registerDebug('joystick', () => ({ ...this.inputCtl.joystick }));
    registerDebug('blur', () => this.game.events.emit(Phaser.Core.Events.BLUR));
    registerDebug('pauseSpawns', (paused: boolean) => { this.enemies.spawningPaused = paused; });
    registerDebug('spawn', (type: EnemyTypeId, n: number, dist = 40) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.enemies.spawn(type, this.player.x + Math.cos(a) * dist, this.player.y + Math.sin(a) * dist, this.run.elapsed);
      }
    });
    registerDebug('clearEnemies', () => this.enemies.clear());
    registerDebug('enemies', () => this.enemies.active.filter((e) => e.alive).length);
    registerDebug('enemyTypes', () => ENEMY_IDS.filter((id) => this.enemies.active.some((e) => e.alive && e.type === id)));
    registerDebug('setEnemyHp', (hp: number) => { for (const e of this.enemies.active) { e.hp = hp; e.maxHp = Math.max(e.maxHp, hp); } });
    registerDebug('setHp', (hp: number) => { this.player.hp = hp; });
    registerDebug('setElapsed', (s: number) => { this.run.elapsed = s; });
    registerDebug('addXp', (n: number) => this.gainXp(n));
    registerDebug('give', (id: keyof typeof UPGRADE_BY_ID) => this.applyChoice({ type: 'upgrade', id }));
    registerDebug('pickups', () => this.pickups.active.map((p) => ({ kind: p.kind, x: p.x, y: p.y })));
    registerDebug('teleport', (x: number, y: number) => { this.player.x = x; this.player.y = y; });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = clampDelta(delta) / 1000;
    this.now += dt;
    this.run.elapsed += dt;
    this.player.update(dt, this.inputCtl.moveVector(), this.now);
    this.enemies.update(dt, this.now, this.run.elapsed, this.player, this.projectiles);
    for (const w of this.weapons) w.update(dt, this.now);
    this.projectiles.update(dt, this.enemies, this.player, this.now);
    this.pickups.update(dt, this.player, (n) => this.gainXp(n), (n) => { this.run.gold += n; });
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    if (this.player.hp <= 0) this.endRun();
  }

  private endRun(): void {
    this.ended = true;
    this.scene.stop('LevelUp');
    const data: GameOverData = { time: this.run.elapsed, level: this.run.level, formId: this.player.formId, gold: this.run.gold };
    this.scene.start('GameOver', data);
  }
}

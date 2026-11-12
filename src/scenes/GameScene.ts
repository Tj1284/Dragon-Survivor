import * as Phaser from 'phaser';
import { GROUND } from '../assets/manifest';
import { ENEMIES, ENEMY_IDS, PICKUPS, PLAYER_WEAPONS, type EnemyTypeId } from '../config/balance';
import { registerDebug, setDebugReady } from '../debug';
import { EnemyManager } from '../game/EnemyManager';
import { Hud } from '../game/Hud';
import { Evolution } from '../game/Evolution';
import { createBreath, createElementWeapon, createUltimate, type ElementWeaponId } from '../game/weapons';
import { lightningStats } from '../game/weapons/LightningBreath';
import { explode } from '../game/weapons/util';
import { ALL_FORMS } from '../logic/evolution';
import type { Element, FormId, Stage } from '../logic/types';
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
  evolution!: Evolution;
  hud!: Hud;
  /** Seconds of evolution pause left; counted down with real frame time so a scene pause can't skip it. */
  private evolvePauseLeft = 0;
  private chooseNext: Element | null = null;
  private readonly weaponIds = new Set<string>();
  private pendingExplosions: { x: number; y: number }[] = [];
  private readonly timings: Record<string, number> = {};

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
    this.weaponIds.clear();
    this.pendingExplosions = [];
    this.evolvePauseLeft = 0;
    this.chooseNext = null;
    lightningStats.maxChain = 0;
    this.evolution = new Evolution(this.ctx, () => this.askElement(), (from, to) => this.onEvolved(from, to));
    this.enemies.onKilled = (e) => {
      this.pickups.dropGem(e.x, e.y, ENEMIES[e.type].xp);
      if (this.rng() < PICKUPS.goldChance) this.pickups.dropGold(e.x, e.y);
      const burst = this.run.owned.fire_burst ?? 0;
      if (burst > 0 && this.rng() < PLAYER_WEAPONS.fireBurst.chancePerLevel * burst) this.pendingExplosions.push({ x: e.x, y: e.y });
    };

    this.hud = new Hud(this, () => this.openPause());
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.input.keyboard?.on('keydown-P', () => this.openPause());
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
    this.cameras.main.setSize(size.width, size.height);
    this.hud.layout(size.width, size.height);
  }

  private openPause(): void {
    if (this.ended || this.levelUpOpen || this.scene.isPaused()) return;
    this.inputCtl.releaseAll();
    this.scene.pause();
    this.scene.launch('Pause');
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

  /** Upgrades that are weapons of their own get created the first time they are picked. */
  private onUpgradeApplied(id: string): void {
    const own: ElementWeaponId[] = ['fire_orbit', 'frost_shards', 'thunder_strike', 'frost_aura'];
    if (!own.includes(id as ElementWeaponId) || this.weaponIds.has(id)) return;
    this.weaponIds.add(id);
    this.weapons.push(createElementWeapon(this.ctx, id as ElementWeaponId));
  }

  /** Runs once every pending level is resolved: evolve if a threshold was crossed, then resume. */
  private async afterLevelResolved(): Promise<void> {
    await this.evolution.check();
    if (this.scene.isPaused()) this.scene.resume();
  }

  private askElement(): Promise<Element> {
    if (this.chooseNext) { const e = this.chooseNext; this.chooseNext = null; return Promise.resolve(e); }
    return new Promise((resolve) => {
      this.inputCtl.releaseAll();
      if (!this.scene.isPaused()) this.scene.pause();
      this.game.events.once(LEVELUP_EVENTS.element, (el: Element) => {
        this.scene.stop('LevelUp');
        resolve(el);
      });
      this.scene.launch('LevelUp', { mode: 'element' } satisfies LevelUpData);
    });
  }

  private onEvolved(from: Stage, to: Stage): void {
    this.refreshStats();
    const element = this.run.element!;
    if (from === 0) {
      const spit = this.weapons.findIndex((w) => w instanceof Spit);
      if (spit >= 0) this.weapons.splice(spit, 1)[0].destroy();
      this.weapons.unshift(createBreath(this.ctx, element));
    }
    if (to === 3 && !this.weaponIds.has('ultimate')) {
      this.weaponIds.add('ultimate');
      this.weapons.push(createUltimate(this.ctx, element));
    }
    this.evolvePauseLeft = PLAYER_WEAPONS.evolution.pause;
  }

  refreshStats(): void {
    const before = this.player.stats.maxHp;
    this.player.stats = computeStats(this.run.stage, this.run.owned);
    const gained = this.player.stats.maxHp - before;
    if (gained > 0) this.player.hp += gained;
    this.player.hp = Math.min(this.player.hp, this.player.stats.maxHp);
    const ice = PLAYER_WEAPONS.iceBreath;
    this.enemies.iceSlow = ice.baseSlow + ice.slowPerLevel * (this.run.owned.deep_chill ?? 0);
    this.enemies.shatterLevel = this.run.owned.shatter ?? 0;
  }

  // ---- debug ----

  private registerDebugCommands(): void {
    registerDebug('player', () => ({ x: this.player.x, y: this.player.y, hp: this.player.hp, maxHp: this.player.stats.maxHp, formId: this.player.formId, level: this.run.level, element: this.run.element, slowUntil: this.player.slowUntil, now: this.now }));
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
    registerDebug('setLevel', (n: number) => { this.run.level = n; this.run.xp = 0; this.run.pendingLevels = 0; void this.afterLevelResolved(); });
    registerDebug('chooseElementNext', (e: Element) => { this.chooseNext = e; });
    registerDebug('evolutions', () => this.evolution.count);
    registerDebug('forceForm', (id: FormId) => this.player.setForm(id));
    registerDebug('allForms', () => [...ALL_FORMS]);
    registerDebug('hitsBy', (source: string) => (source === 'lightning' ? lightningStats.maxChain : 0));
    registerDebug('frozenCount', () => this.enemies.active.filter((e) => e.alive && this.now < e.ice.frozenUntil).length);
    registerDebug('hud', () => this.hud.positions());
    registerDebug('camera', () => ({ midX: this.cameras.main.midPoint.x, midY: this.cameras.main.midPoint.y }));
    registerDebug('fps', () => this.game.loop.actualFps);
    registerDebug('counts', () => ({ enemies: this.enemies.active.filter((e) => e.alive).length, projectiles: this.projectiles.activeCount, pickups: this.pickups.activeCount }));
    registerDebug('poolStats', () => ({ enemies: this.enemies.createdCount, projectiles: this.projectiles.createdCount, pickups: this.pickups.createdCount }));
    registerDebug('timings', () => Object.fromEntries(Object.entries(this.timings).map(([k, v]) => [k, Number(v.toFixed(3))])));
    registerDebug('fireTest', (n: number, life: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.projectiles.fire({ x: this.player.x, y: this.player.y, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20, damage: 0, radius: 3, life, owner: 'player', key: 'spit', pierce: 1e9, source: 'test' });
      }
    });
    registerDebug('teleport', (x: number, y: number) => { this.player.x = x; this.player.y = y; });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    const dt = clampDelta(delta) / 1000;
    const move = this.inputCtl.moveVector();
    if (this.evolvePauseLeft > 0) { this.evolvePauseLeft -= dt; return; } // short pause while the evolution plays
    this.now += dt;
    this.run.elapsed += dt;
    this.player.update(dt, move, this.now);
    let t0 = performance.now();
    this.enemies.update(dt, this.now, this.run.elapsed, this.player, this.projectiles);
    t0 = this.time_('enemies', t0);
    for (const w of this.weapons) w.update(dt, this.now);
    t0 = this.time_('weapons', t0);
    for (const ex of this.pendingExplosions.splice(0)) explode(this.ctx, ex.x, ex.y, PLAYER_WEAPONS.fireBurst.radius, PLAYER_WEAPONS.fireBurst.damage * this.player.stats.damageMult, this.now, 'fire_burst');
    this.projectiles.update(dt, this.enemies, this.player, this.now);
    this.time_('projectiles', t0);
    this.pickups.update(dt, this.player, (n) => this.gainXp(n), (n) => { this.run.gold += n; });
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    this.hud.update(this.run, this.player);
    if (this.player.hp <= 0) this.endRun();
  }

  /** Exponential moving average (ms) of a system's update time, for the debug timings() command. */
  private time_(name: string, start: number): number {
    const now = performance.now();
    this.timings[name] = (this.timings[name] ?? 0) * 0.95 + (now - start) * 0.05;
    return now;
  }

  private endRun(): void {
    this.ended = true;
    this.scene.stop('LevelUp');
    const data: GameOverData = { time: this.run.elapsed, level: this.run.level, formId: this.player.formId, gold: this.run.gold };
    this.scene.start('GameOver', data);
  }
}

import * as Phaser from 'phaser';
import { GROUND } from '../assets/manifest';
import { ENEMIES, ENEMY_IDS, PICKUPS, PLAYER_WEAPONS, type EnemyTypeId } from '../config/balance';
import { isDebug, registerDebug, setDebugReady } from '../debug';
import { EnemyManager } from '../game/EnemyManager';
import { Hud } from '../game/Hud';
import { Bosses } from '../game/Bosses';
import { BOSS_AI, BOSSES } from '../logic/bosses';
import { t } from '../i18n';
import { Decor } from '../game/Decor';
import { Juice } from '../game/Juice';
import { DamageNumbers } from '../game/DamageNumbers';
import { Evolution } from '../game/Evolution';
import { createAttack, createUltimate } from '../game/weapons';
import { lightningStats } from '../game/weapons/LightningBreath';
import { resetWeaponStats, weaponStats } from '../game/weapons/stats';
import { ALL_FORMS } from '../logic/evolution';
import type { Element, FormId, Stage } from '../logic/types';
import { InputController } from '../game/InputController';
import { Pickups } from '../game/Pickups';
import { Player } from '../game/Player';
import { Projectiles } from '../game/Projectiles';
import { createRunState, type RunState } from '../game/RunState';
import type { Weapon, WeaponCtx } from '../game/weapons/types';
import { createRng } from '../logic/rng';
import { clampDelta } from '../logic/time';
import { metaBonus, type MetaBonus } from '../logic/meta';
import { storage } from '../platform/storage';
import { hideLoading } from '../ui/loading';
import { audio } from '../audio';
import { addForms, addRunResult } from '../logic/save';
import { formId } from '../logic/evolution';
import { FALLBACK, computeStats, heldAttacks, nextOrder, rollChoices, spitToBreath, tagOf, type AttackId, type Choice, type UpgradeId } from '../logic/attacks';
import { applyXp } from '../logic/xp';
import type { GameOverData } from './GameOverScene';
import { LEVELUP_EVENTS, type LevelUpData } from './LevelUpScene';

/** Emitted by the pause menu to end the run and go to the game-over screen. */
export const QUIT_EVENT = 'run:quit';

export class GameScene extends Phaser.Scene {
  player!: Player;
  inputCtl!: InputController;
  ground!: Phaser.GameObjects.TileSprite;
  enemies!: EnemyManager;
  projectiles!: Projectiles;
  pickups!: Pickups;
  run!: RunState;
  /** One weapon per attack the dragon holds. */
  attacks = new Map<AttackId, Weapon>();
  private ultimate: Weapon | null = null;
  private readonly hitCounts: Record<string, number> = {};
  private hitLog: { source: string; dx: number; dy: number }[] = [];
  ctx!: WeaponCtx;
  rng!: () => number;
  now = 0;
  private ended = false;
  private levelUpOpen = false;
  evolution!: Evolution;
  hud!: Hud;
  bosses!: Bosses;
  /** Seconds left before the victory screen once the final boss is down; 0 = not won yet. */
  private victoryIn = 0;
  /** Where the first-run controls hint started; null once it is gone. */
  private hintFrom: { x: number; y: number; until: number } | null = null;
  /** Permanent Lair bonuses, read from the save at the start of each run. */
  private meta!: MetaBonus;
  juice!: Juice;
  damageNumbers!: DamageNumbers;
  decor!: Decor;
  /** Seconds of evolution pause left; counted down with real frame time so a scene pause can't skip it. */
  private evolvePauseLeft = 0;
  private chooseNext: Element | null = null;
  private readonly timings: Record<string, number> = {};
  private readonly debugLog = isDebug();

  constructor() { super('Game'); }

  create(): void {
    this.now = 0;
    this.ended = false;
    this.levelUpOpen = false;
    this.run = createRunState();
    this.meta = metaBonus(storage.load().meta);
    const { width, height } = this.scale.gameSize;
    this.ground = this.add.tileSprite(0, 0, width, height, GROUND.key).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.player = new Player(this, 0, 0);
    this.player.stats = computeStats(0, this.run.owned, this.meta);
    this.player.hp = this.player.stats.maxHp;
    this.cameras.main.startFollow(this.player.sprite, true);
    this.inputCtl = new InputController(this);
    this.rng = createRng((Math.random() * 2 ** 31) | 0);
    this.enemies = new EnemyManager(this, this.rng);
    this.projectiles = new Projectiles(this);
    this.pickups = new Pickups(this);
    this.ctx = { scene: this, player: this.player, enemies: this.enemies, projectiles: this.projectiles, run: this.run };
    this.attacks = new Map();
    this.ultimate = null;
    for (const k of Object.keys(this.hitCounts)) delete this.hitCounts[k];
    this.syncWeapons();
    this.evolvePauseLeft = 0;
    this.chooseNext = null;
    lightningStats.maxChain = 0;
    resetWeaponStats();
    this.hitLog = [];
    this.evolution = new Evolution(this.ctx, () => this.askElement(), (from, to) => this.onEvolved(from, to));
    this.juice = new Juice(this, this.player);
    this.decor = new Decor(this);
    this.damageNumbers = new DamageNumbers(this);
    this.enemies.onHit = (e, dmg, source) => {
      this.juice.hit(e.x, e.y);
      this.damageNumbers.show(e.x, e.y - e.radius, dmg, e.boss !== null);
      audio.play('hit');
      if (source) this.hitCounts[source] = (this.hitCounts[source] ?? 0) + 1;
      if (source && this.debugLog && this.hitLog.length < 500) this.hitLog.push({ source, dx: e.x - this.player.x, dy: e.y - this.player.y });
    };
    this.bosses = new Bosses(this, this.enemies, this.player);
    this.victoryIn = 0;
    this.enemies.onKilled = (e) => {
      if (e.boss) { this.onBossKilled(e.boss, e.x, e.y); return; }
      audio.play('kill');
      this.juice.death(e.x, e.y);
      this.pickups.dropGem(e.x, e.y, ENEMIES[e.type].xp);
      if (this.rng() < PICKUPS.goldChance) this.pickups.dropGold(e.x, e.y);
    };

    this.hud = new Hud(this, () => this.openPause());
    this.hud.refreshAttacks(this.run);
    this.input.keyboard?.on('keydown-ESC', () => this.openPause());
    this.input.keyboard?.on('keydown-P', () => this.openPause());
    this.game.events.on(LEVELUP_EVENTS.picked, this.onUpgradePicked, this);
    this.game.events.on(QUIT_EVENT, this.quitRun, this);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(LEVELUP_EVENTS.picked, this.onUpgradePicked, this);
      this.game.events.off(QUIT_EVENT, this.quitRun, this);
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize, this);
      this.inputCtl.destroy();
      for (const w of this.attacks.values()) w.destroy();
      this.ultimate?.destroy();
      this.bosses.destroy();
      audio.stopMusic();
    });
    this.registerDebugCommands();
    // first run only: teach the controls by play, hide the hint once the dragon has moved
    this.hintFrom = storage.load().played ? null : { x: this.player.x, y: this.player.y, until: 8 };
    if (this.hintFrom) this.hud.showHint(t(this.sys.game.device.input.touch ? 'hint_touch' : 'hint_keys'));
    setDebugReady(true);
    hideLoading();
    audio.startMusic();
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.ground.setSize(size.width, size.height);
    this.cameras.main.setSize(size.width, size.height);
    this.hud.layout(size.width, size.height);
    this.juice.layout(size.width, size.height);
  }

  private openPause(): void {
    if (this.ended || this.levelUpOpen || this.scene.isPaused()) return;
    this.inputCtl.releaseAll();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  // ---- experience and level-ups ----

  gainXp(n: number): void {
    const r = applyXp(this.run, n * this.meta.xpMult);
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
    const data: LevelUpData = { mode: 'upgrade', choices: rollChoices({ owned: this.run.owned, element: this.run.element, gold: this.run.goldAttacks }, this.rng), owned: this.run.owned };
    this.scene.pause();
    audio.play('levelup');
    this.scene.launch('LevelUp', data);
  }

  private onUpgradePicked(choice: Choice): void {
    this.scene.stop('LevelUp');
    audio.play('pick');
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
    if (choice.type === 'gold') {
      if (!this.run.goldAttacks.includes(choice.id)) this.run.goldAttacks.push(choice.id);
      this.hud.refreshAttacks(this.run);
      return;
    }
    this.run.owned[choice.id] = (this.run.owned[choice.id] ?? 0) + 1;
    this.run.picks.push(tagOf(choice.id));
    this.refreshStats();
    this.syncWeapons();
    this.hud.refreshAttacks(this.run);
  }

  /** Keeps exactly one weapon per held attack: creates the new ones and drops the ones no longer held. */
  private syncWeapons(): void {
    this.run.attackOrder = nextOrder(this.run.attackOrder, this.run.owned);
    const held = heldAttacks(this.run.owned);
    for (const [id, weapon] of this.attacks) {
      if (!held.includes(id)) { weapon.destroy(); this.attacks.delete(id); }
    }
    for (const id of held) if (!this.attacks.has(id)) this.attacks.set(id, createAttack(this.ctx, id));
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
      // the starting spit turns into the breath of the element, keeping its level and its slot
      this.run.owned = spitToBreath(this.run.owned, element);
      this.syncWeapons();
      this.hud.refreshAttacks(this.run);
    }
    if (to === 3 && !this.ultimate) this.ultimate = createUltimate(this.ctx, element);
    this.evolvePauseLeft = PLAYER_WEAPONS.evolution.pause;
    audio.play('evolve');
    this.juice.setElement(element, to);
    // record every stage passed through (a big xp jump can skip one) and save them at once
    for (let s = from + 1; s <= to; s++) {
      const f = formId(s as Stage, element);
      if (!this.run.forms.includes(f)) this.run.forms.push(f);
    }
    storage.save(addForms(storage.load(), this.run.forms));
  }

  refreshStats(): void {
    const before = this.player.stats.maxHp;
    this.player.stats = computeStats(this.run.stage, this.run.owned, this.meta);
    const gained = this.player.stats.maxHp - before;
    if (gained > 0) this.player.hp += gained;
    this.player.hp = Math.min(this.player.hp, this.player.hpLimit);
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
    // test targets in one call, so no attack can hit them before they are tough and frozen
    registerDebug('spawnDummies', (type: EnemyTypeId, n: number, dist: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const e = this.enemies.spawn(type, this.player.x + Math.cos(a) * dist, this.player.y + Math.sin(a) * dist, this.run.elapsed);
        e.hp = e.maxHp = 1e6;
        e.ice = { ...e.ice, frozenUntil: 1e9 };
      }
    });
    registerDebug('spawnAt', (type: EnemyTypeId, dx: number, dy: number) => { this.enemies.spawn(type, this.player.x + dx, this.player.y + dy, this.run.elapsed); });
    registerDebug('enemies', () => this.enemies.active.filter((e) => e.alive).length);
    registerDebug('enemyTypes', () => ENEMY_IDS.filter((id) => this.enemies.active.some((e) => e.alive && e.type === id)));
    registerDebug('setEnemyHp', (hp: number) => { for (const e of this.enemies.active) { e.hp = hp; e.maxHp = Math.max(e.maxHp, hp); } });
    registerDebug('setHp', (hp: number) => { this.player.hp = hp; this.player.debugHpFloor = hp > this.player.stats.maxHp ? hp : 0; });
    registerDebug('setElapsed', (s: number) => { this.run.elapsed = s; });
    registerDebug('addXp', (n: number) => this.gainXp(n));
    registerDebug('give', (id: UpgradeId) => this.applyChoice({ type: 'upgrade', id }));
    registerDebug('giveGold', (id: AttackId) => this.applyChoice({ type: 'gold', id }));
    registerDebug('attacks', () => heldAttacks(this.run.owned).map((id) => ({ id, level: this.run.owned[id], gold: this.run.goldAttacks.includes(id) })));
    registerDebug('hitsBySource', () => ({ ...this.hitCounts }));
    registerDebug('hitLog', () => this.hitLog);
    registerDebug('clearHitLog', () => { this.hitLog = []; });
    registerDebug('weaponStats', () => ({ ...weaponStats }));
    registerDebug('freezeEnemies', () => { for (const e of this.enemies.active) e.ice = { ...e.ice, frozenUntil: 1e9 }; });
    registerDebug('enemyDistances', () => this.enemies.active.filter((e) => e.alive).map((e) => Math.hypot(e.x - this.player.x, e.y - this.player.y)));
    registerDebug('stunnedCount', () => this.enemies.active.filter((e) => e.alive && this.now < e.stunUntil).length);
    registerDebug('setFacing', (dir: number) => this.player.sprite.setFlipX(dir < 0));
    registerDebug('dropGems', (n: number, xp: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 200 + Math.random() * 200;
        this.pickups.dropGem(this.player.x + Math.cos(a) * r, this.player.y + Math.sin(a) * r, xp);
      }
    });
    registerDebug('gemXpTotal', () => this.pickups.gemXpTotal());
    registerDebug('setGold', (n: number) => { this.run.gold = n; });
    registerDebug('shootBossAt', (offset: number) => {
      const b = this.enemies.active.find((e) => e.boss && e.alive);
      if (b) this.projectiles.fire({ x: b.x + offset, y: b.y, vx: 0, vy: 0, damage: 10, radius: 3, life: 0.1, owner: 'player', key: 'spit', pierce: 0, source: 'debug' });
    });
    registerDebug('bosses', () => this.bosses.alive());
    registerDebug('damageBoss', (n: number) => { for (const e of this.enemies.active) if (e.boss && e.alive) this.enemies.hit(e, n, this.now, 'debug'); });
    registerDebug('damageNumbers', () => ({ active: this.damageNumbers.active, shownTotal: this.damageNumbers.shownTotal, recycledYoung: this.damageNumbers.recycledYoung }));
    registerDebug('burstDamageNumbers', (n: number) => { for (let i = 0; i < n; i++) this.damageNumbers.show(this.player.x, this.player.y, 10, false); });
    registerDebug('dropChestAt', (dx: number, dy: number) => this.pickups.dropChest(this.player.x + dx, this.player.y + dy));
    registerDebug('resetBossFlash', () => { this.enemies.bossFrames = 0; this.enemies.bossFlashFrames = 0; });
    registerDebug('bossFlashRatio', () => this.enemies.bossFlashFrames / Math.max(1, this.enemies.bossFrames));
    registerDebug('dropChest', () => this.pickups.dropChest(this.player.x, this.player.y));
    registerDebug('clearPickups', () => this.pickups.clear());
    registerDebug('bossPatterns', () => [...this.bosses.patternsUsed]);
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
    this.bosses.update(dt, this.now, this.run.elapsed);
    t0 = this.time_('enemies', t0);
    for (const w of this.attacks.values()) w.update(dt, this.now);
    this.ultimate?.update(dt, this.now);
    t0 = this.time_('weapons', t0);
    this.projectiles.update(dt, this.enemies, this.player, this.now);
    this.time_('projectiles', t0);
    this.pickups.update(dt, this.player, (n) => { audio.play('gem'); this.gainXp(n); }, (n) => { audio.play('gold'); this.run.gold += n; }, () => { audio.play('chest'); this.openChest(); });
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    this.hud.update(this.run, this.player);
    const view = this.cameras.main.worldView;
    let chest: { dx: number; dy: number } | null = null;
    let best = Infinity;
    for (const p of this.pickups.active) {
      if (p.kind !== 'chest' || view.contains(p.x, p.y)) continue;
      const d = (p.x - this.player.x) ** 2 + (p.y - this.player.y) ** 2;
      if (d < best) { best = d; chest = { dx: p.x - this.player.x, dy: p.y - this.player.y }; }
    }
    this.hud.pointTo(chest, this.scale.gameSize.width, this.scale.gameSize.height);
    if (this.hintFrom) {
      this.hintFrom.until -= dt;
      if (this.hintFrom.until <= 0 || Math.hypot(this.player.x - this.hintFrom.x, this.player.y - this.hintFrom.y) >= 60) {
        this.hud.hideHint();
        this.hintFrom = null;
      }
    }
    const boss = this.bosses.current();
    this.hud.setBoss(boss ? t(`boss_${boss.def.id}`) : null, boss ? boss.e.hp / boss.e.maxHp : 0);
    this.juice.update(dt, this.now);
    this.damageNumbers.update(dt);
    this.decor.update();
    if (this.victoryIn > 0) {
      this.victoryIn -= dt;
      if (this.victoryIn <= 0) { this.endRun(); return; }
    }
    if (this.player.hp <= 0 && !this.run.won) this.endRun();
  }

  /** Exponential moving average (ms) of a system's update time, for the debug timings() command. */
  private time_(name: string, start: number): number {
    const now = performance.now();
    this.timings[name] = (this.timings[name] ?? 0) * 0.95 + (now - start) * 0.05;
    return now;
  }

  /** Mobile browsers often kill a backgrounded tab: bank the run's gold so far, so it isn't lost. */
  private readonly onVisibility = (): void => {
    if (document.visibilityState !== 'hidden' || this.ended || !this.run) return;
    const earned = Math.round(this.run.gold * this.meta.goldMult) - this.run.bankedGold;
    if (earned <= 0) return;
    storage.save(addRunResult(storage.load(), { gold: earned, time: 0, won: false, forms: this.run.forms }));
    this.run.bankedGold += earned;
  };

  /** Leaving from the pause menu ends the run normally, so the gold earned so far is kept. */
  private quitRun(): void {
    if (this.ended) return;
    this.scene.stop('Pause');
    this.endRun();
  }

  private onBossKilled(id: string, x: number, y: number): void {
    this.juice.death(x, y);
    const def = BOSSES.find((b) => b.id === id)!;
    if (def.final) {
      this.run.won = true;
      this.run.gold += BOSS_AI.victoryGold;
      this.victoryIn = BOSS_AI.victoryDelay;
      this.juice.flash(0xfff2a8);
    } else {
      this.pickups.dropChest(x, y);
    }
  }

  /** A chest is one free upgrade: it joins the normal level-up queue without changing the level. */
  private openChest(): void {
    this.run.pendingLevels++;
    this.openNextLevelUp();
  }

  private endRun(): void {
    this.ended = true;
    this.scene.stop('LevelUp');
    const data: GameOverData = { time: this.run.elapsed, level: this.run.level, formId: this.player.formId, gold: Math.round(this.run.gold * this.meta.goldMult), won: this.run.won, runId: this.run.id, forms: [...this.run.forms], banked: this.run.bankedGold };
    this.scene.start('GameOver', data);
  }
}

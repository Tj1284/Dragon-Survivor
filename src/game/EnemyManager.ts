import * as Phaser from 'phaser';
import { ENEMY_SHEETS } from '../assets/manifest';
import { ENEMIES, ENEMY_AI, type EnemyTypeId } from '../config/balance';
import { damageMultiplier, newIceStatus, type IceStatus } from '../logic/combat';
import { Pool } from '../logic/pool';
import { hpMult, pickEnemyType, spawnPosition, spawnRadius, stepSpawnBudget, targetAlive } from '../logic/spawn';
import { SpatialGrid } from '../logic/spatialGrid';
import type { Player } from './Player';
import type { Projectiles } from './Projectiles';

export interface Enemy {
  id: number; type: EnemyTypeId; x: number; y: number; hp: number; maxHp: number; radius: number; alive: boolean;
  sprite: Phaser.GameObjects.Sprite; ice: IceStatus; hitCooldowns: Map<string, number>;
  state: 'move' | 'windup' | 'dash'; timer: number; dashX: number; dashY: number;
  contactReadyAt: number; flashUntil: number;
  /** Extra slow (0..1) applied this frame by auras; reset every frame. */
  auraSlow: number;
}

export class EnemyManager {
  readonly grid = new SpatialGrid(32);
  /** Grid ids are indices into this array; it is only compacted at the start of update(). */
  readonly active: Enemy[] = [];
  onKilled: (e: Enemy) => void = () => {};
  onHit: (e: Enemy, damage: number, source?: string) => void = () => {};
  spawningPaused = false;
  /** Slow applied by ice hits. */
  iceSlow = 0.5;
  shatterLevel = 0;

  private readonly pool: Pool<Enemy>;
  private nextId = 1;
  private readonly near: number[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly rng: () => number) {
    this.pool = new Pool<Enemy>(
      () => ({
        id: 0, type: 'squire', x: 0, y: 0, hp: 0, maxHp: 0, radius: 8, alive: false,
        sprite: scene.add.sprite(0, 0, ENEMY_SHEETS.squire.key).setDepth(5).setVisible(false),
        ice: newIceStatus(), hitCooldowns: new Map(), state: 'move', timer: 0, dashX: 0, dashY: 0,
        contactReadyAt: 0, flashUntil: 0, auraSlow: 0,
      }),
      (e) => { e.alive = false; e.sprite.setVisible(false).stop(); e.hitCooldowns.clear(); },
    );
  }

  get createdCount(): number { return this.pool.createdCount; }

  spawn(type: EnemyTypeId, x: number, y: number, elapsed: number): Enemy {
    const def = ENEMIES[type];
    const e = this.pool.acquire();
    e.id = this.nextId++;
    e.type = type; e.x = x; e.y = y;
    e.maxHp = e.hp = def.hp * hpMult(elapsed);
    e.radius = def.radius;
    e.alive = true;
    e.ice = newIceStatus();
    e.state = 'move';
    e.timer = this.rng() * 2;
    e.contactReadyAt = 0;
    e.flashUntil = 0;
    e.auraSlow = 0;
    e.sprite.setTexture(ENEMY_SHEETS[type].key, 0).setVisible(true).setPosition(x, y).clearTint();
    e.sprite.setTintMode(Phaser.TintModes.MULTIPLY);
    e.sprite.play(`${ENEMY_SHEETS[type].key}_loop`);
    this.active.push(e);
    return e;
  }

  /** Applies damage (with the ice/shatter multiplier). Returns true if the enemy died. */
  hit(e: Enemy, damage: number, now: number, source?: string): boolean {
    if (!e.alive) return false;
    const dealt = damage * damageMultiplier(e.ice, now, this.shatterLevel);
    e.hp -= dealt;
    e.flashUntil = now + 0.06;
    this.onHit(e, dealt, source);
    if (e.hp <= 0) {
      e.alive = false;
      e.sprite.setVisible(false);
      this.onKilled(e);
      return true;
    }
    return false;
  }

  nearest(x: number, y: number, maxRange: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = maxRange * maxRange;
    for (const e of this.active) {
      if (!e.alive) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d <= bestD) { best = e; bestD = d; }
    }
    return best;
  }

  inRadius(x: number, y: number, r: number, out: Enemy[]): Enemy[] {
    out.length = 0;
    this.grid.queryRadius(x, y, r + 12, this.near);
    for (const idx of this.near) {
      const e = this.active[idx];
      if (e && e.alive && Math.hypot(e.x - x, e.y - y) <= r + e.radius) out.push(e);
    }
    return out;
  }

  update(dt: number, now: number, elapsed: number, player: Player, projectiles: Projectiles): void {
    this.compact();
    this.spawnUpTo(dt, elapsed, player);
    const view = this.scene.scale.gameSize;
    const despawnR = spawnRadius(view.width, view.height) * ENEMY_AI.despawnFactor;

    for (const e of this.active) {
      const def = ENEMIES[e.type];
      const dx = player.x - e.x, dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > despawnR) {
        const p = spawnPosition(player.x, player.y, view.width, view.height, this.rng);
        e.x = p.x; e.y = p.y; e.state = 'move';
        continue;
      }
      const frozen = now < e.ice.frozenUntil;
      const slow = frozen ? 1 : Math.min(0.9, (now < e.ice.slowUntil ? this.iceSlow : 0) + e.auraSlow);
      const speed = def.speed * (1 - slow);
      e.auraSlow = 0;
      e.timer -= dt;
      let mx = 0, my = 0;
      if (!frozen) {
        switch (e.type) {
          case 'archer': ({ mx, my } = this.keepDistance(dx, dy, dist, ENEMY_AI.archer.keepDistance));
            if (e.timer <= 0 && dist < 220) {
              e.timer = ENEMY_AI.archer.fireEvery;
              const s = ENEMY_AI.archer.arrowSpeed;
              projectiles.fire({ x: e.x, y: e.y, vx: (dx / dist) * s, vy: (dy / dist) * s, damage: ENEMY_AI.archer.arrowDamage, radius: 3, life: 3, owner: 'enemy', key: 'arrow', pierce: 0 });
            }
            break;
          case 'netter': mx = dx / dist; my = dy / dist;
            if (e.timer <= 0 && dist < ENEMY_AI.netter.range) {
              e.timer = ENEMY_AI.netter.throwEvery;
              const s = ENEMY_AI.netter.netSpeed;
              projectiles.fire({ x: e.x, y: e.y, vx: (dx / dist) * s, vy: (dy / dist) * s, damage: 0, radius: 6, life: 2, owner: 'enemy', key: 'net', pierce: 0,
                onHit: (_t, _p, hitNow) => { player.slowUntil = hitNow + ENEMY_AI.netter.slowDuration; } });
            }
            break;
          case 'cleric': ({ mx, my } = this.keepDistance(dx, dy, dist, ENEMY_AI.cleric.keepDistance));
            if (e.timer <= 0) { e.timer = ENEMY_AI.cleric.healEvery; this.healAround(e); }
            break;
          case 'lancer': ({ mx, my } = this.lancer(e, dt, dx, dy, dist));
            break;
          default: mx = dx / dist; my = dy / dist;
        }
      }
      const moveSpeed = e.state === 'dash' ? ENEMY_AI.lancer.dashSpeed * (1 - slow) : speed;
      e.x += mx * moveSpeed * dt;
      e.y += my * moveSpeed * dt;

      if (dist < e.radius + player.radius && now >= e.contactReadyAt && def.damage > 0) {
        player.damage(def.damage);
        e.contactReadyAt = now + ENEMY_AI.contactCooldown;
      }
      e.sprite.setFlipX(dx < 0);
    }

    this.separate();
    for (const e of this.active) {
      e.sprite.setPosition(e.x, e.y);
      const flashing = now < e.flashUntil;
      const frozen = now < e.ice.frozenUntil;
      if (flashing) e.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (frozen) e.sprite.setTint(0x9fdcff).setTintMode(Phaser.TintModes.MULTIPLY);
      else if (e.state === 'windup') e.sprite.setTint(0xff8080).setTintMode(Phaser.TintModes.MULTIPLY);
      else e.sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    }
  }

  private keepDistance(dx: number, dy: number, dist: number, keep: number): { mx: number; my: number } {
    if (dist > keep + 10) return { mx: dx / dist, my: dy / dist };
    if (dist < keep - 10) return { mx: -dx / dist, my: -dy / dist };
    return { mx: 0, my: 0 };
  }

  private lancer(e: Enemy, dt: number, dx: number, dy: number, dist: number): { mx: number; my: number } {
    const L = ENEMY_AI.lancer;
    if (e.state === 'move') {
      if (dist < L.triggerRange) { e.state = 'windup'; e.timer = L.windup; e.dashX = dx / dist; e.dashY = dy / dist; return { mx: 0, my: 0 }; }
      return { mx: dx / dist, my: dy / dist };
    }
    if (e.state === 'windup') {
      if (e.timer <= 0) { e.state = 'dash'; e.timer = L.dashTime; }
      return { mx: 0, my: 0 };
    }
    if (e.timer <= 0) e.state = 'move';
    void dt;
    return { mx: e.dashX, my: e.dashY };
  }

  private healAround(cleric: Enemy): void {
    const C = ENEMY_AI.cleric;
    this.grid.queryRadius(cleric.x, cleric.y, C.healRange, this.near);
    for (const idx of this.near) {
      const o = this.active[idx];
      if (o && o.alive && o !== cleric) o.hp = Math.min(o.maxHp, o.hp + C.healAmount);
    }
  }

  private separate(): void {
    const S = ENEMY_AI.separation;
    this.rebuildGrid();
    for (let i = 0; i < this.active.length; i++) {
      const e = this.active[i];
      this.grid.queryRadius(e.x, e.y, S.radius, this.near);
      let n = 0;
      for (const j of this.near) {
        if (j === i || n >= S.maxNeighbors) continue;
        const o = this.active[j];
        const dx = e.x - o.x, dy = e.y - o.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const push = (S.radius - d) * 0.5;
        e.x += (dx / d) * push;
        e.y += (dy / d) * push;
        n++;
      }
    }
    this.rebuildGrid();
  }

  private rebuildGrid(): void {
    this.grid.clear();
    for (let i = 0; i < this.active.length; i++) this.grid.insert(i, this.active[i].x, this.active[i].y);
  }

  private compact(): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      if (e.alive) continue;
      this.active[i] = this.active[this.active.length - 1];
      this.active.pop();
      this.pool.release(e);
    }
  }

  private spawnBudget = 1; // the first enemy shows up right away

  private spawnUpTo(dt: number, elapsed: number, player: Player): void {
    if (this.spawningPaused) return;
    const view = this.scene.scale.gameSize;
    const step = stepSpawnBudget(this.spawnBudget, dt, elapsed, targetAlive(elapsed) - this.active.length);
    this.spawnBudget = step.budget;
    for (let i = 0; i < step.count; i++) {
      const p = spawnPosition(player.x, player.y, view.width, view.height, this.rng);
      this.spawn(pickEnemyType(elapsed, this.rng), p.x, p.y, elapsed);
    }
  }

  clear(): void {
    for (const e of this.active) this.pool.release(e);
    this.active.length = 0;
    this.grid.clear();
  }
}

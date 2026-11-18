import type * as Phaser from 'phaser';
import { BOSS_AI, bossesDue, type BossDef, type BossId, type BossPattern } from '../logic/bosses';
import { hpMult } from '../logic/spawn';
import type { Enemy, EnemyManager } from './EnemyManager';
import type { Player } from './Player';
import { audio } from '../audio';

interface Active {
  def: BossDef; e: Enemy;
  /** The enemy id when it spawned: pooled objects get reused, so a dead boss's object may come back as a squire. */
  id: number;
  mark: Phaser.GameObjects.Arc;
  next: number; state: 'chase' | 'windup' | 'charge' | 'slam';
  t: number; dx: number; dy: number; slamX: number; slamY: number; contactReadyAt: number;
}

/** Spawns the bosses on schedule and drives their patterns: charge, area slam and summoning squires. */
export class Bosses {
  readonly spawned = new Set<BossId>();
  readonly patternsUsed: BossPattern[] = [];
  private readonly list: Active[] = [];

  constructor(private readonly scene: Phaser.Scene, private readonly enemies: EnemyManager, private readonly player: Player) {
  }

  spawn(def: BossDef, elapsed: number): Enemy {
    this.spawned.add(def.id);
    audio.play('boss');
    const view = this.scene.scale.gameSize;
    const a = Math.random() * Math.PI * 2;
    const r = Math.hypot(view.width, view.height) / 2 + 30;
    const e = this.enemies.spawnBoss(def, this.player.x + Math.cos(a) * r, this.player.y + Math.sin(a) * r, hpMult(elapsed));
    const mark = this.scene.add.circle(0, 0, BOSS_AI.slam.radius, 0xe8402a, 0.18).setStrokeStyle(2, 0xe8402a, 0.9).setDepth(3).setVisible(false);
    this.list.push({ def, e, id: e.id, mark, next: 0, state: 'chase', t: 1.5, dx: 0, dy: 0, slamX: 0, slamY: 0, contactReadyAt: 0 });
    return e;
  }

  /** The boss currently on screen (the newest one), for the health bar. */
  current(): { def: BossDef; e: Enemy } | null {
    for (let i = this.list.length - 1; i >= 0; i--) if (this.isAlive(this.list[i])) return this.list[i];
    return null;
  }

  alive(): { id: BossId; hp: number; x: number; y: number }[] {
    return this.list.filter((b) => this.isAlive(b)).map((b) => ({ id: b.def.id, hp: b.e.hp, x: b.e.x, y: b.e.y }));
  }

  update(dt: number, now: number, elapsed: number): void {
    for (const def of bossesDue(elapsed, this.spawned)) this.spawn(def, elapsed);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if (!this.isAlive(b)) { b.mark.destroy(); this.list.splice(i, 1); continue; }
      this.step(b, dt, now);
      if (b.state !== 'slam') b.mark.setVisible(false);
    }
  }

  /** Still the same living boss (its pooled object may have been handed to a new enemy). */
  private isAlive(b: Active): boolean {
    return b.e.alive && b.e.id === b.id && b.e.boss === b.def.id;
  }

  private step(b: Active, dt: number, now: number): void {
    const { e, def } = b;
    const p = this.player;
    const dx = p.x - e.x, dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    b.t -= dt;
    switch (b.state) {
      case 'chase': {
        const slow = now < e.ice.slowUntil || e.auraSlow > 0 ? 0.7 : 1; // bosses are slowed but never frozen or stunned
        e.auraSlow = 0;
        e.x += (dx / dist) * def.speed * slow * dt;
        e.y += (dy / dist) * def.speed * slow * dt;
        // patterns only start within reach, so the player always sees the warning
        if (b.t <= 0 && dist <= BOSS_AI.patternRange) this.startPattern(b, dx / dist, dy / dist);
        break;
      }
      case 'windup':
        if (b.t <= 0) { b.state = 'charge'; b.t = BOSS_AI.charge.time; }
        break;
      case 'charge':
        e.x += b.dx * BOSS_AI.charge.speed * dt;
        e.y += b.dy * BOSS_AI.charge.speed * dt;
        if (b.t <= 0) this.toChase(b);
        break;
      case 'slam':
        b.mark.setVisible(true).setPosition(b.slamX, b.slamY).setAlpha(0.5 + 0.5 * Math.sin(now * 20));
        if (b.t <= 0) {
          if (Math.hypot(p.x - b.slamX, p.y - b.slamY) <= BOSS_AI.slam.radius) p.damage(BOSS_AI.slam.damage);
          this.scene.cameras.main.shake(120, 0.006);
          audio.play('slam');
          this.toChase(b);
        }
        break;
    }
    if (dist < e.radius + p.radius && now >= b.contactReadyAt) {
      p.damage(def.damage);
      b.contactReadyAt = now + BOSS_AI.contactCooldown;
    }
    e.ice = { ...e.ice, frozenUntil: 0 };
    e.stunUntil = 0;
    e.sprite.setFlipX(dx < 0).setPosition(e.x, e.y);
    if (b.state === 'windup') e.sprite.setTint(0xff8080);
  }

  private startPattern(b: Active, ux: number, uy: number): void {
    const pattern = b.def.patterns[b.next % b.def.patterns.length];
    b.next++;
    this.patternsUsed.push(pattern);
    if (pattern === 'charge') {
      b.state = 'windup'; b.t = BOSS_AI.charge.windup; b.dx = ux; b.dy = uy;
    } else if (pattern === 'slam') {
      b.state = 'slam'; b.t = BOSS_AI.slam.delay; b.slamX = this.player.x; b.slamY = this.player.y;
    } else {
      const S = BOSS_AI.summon;
      for (let i = 0; i < S.count; i++) {
        const a = (i / S.count) * Math.PI * 2;
        this.enemies.spawn('squire', b.e.x + Math.cos(a) * S.ring, b.e.y + Math.sin(a) * S.ring, 0);
      }
      this.toChase(b);
    }
  }

  private toChase(b: Active): void {
    b.state = 'chase';
    b.t = BOSS_AI.every;
  }

  destroy(): void { for (const b of this.list) b.mark.destroy(); }
}

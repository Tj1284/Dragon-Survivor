import * as Phaser from 'phaser';
import { MAX_ENEMY_RADIUS } from '../logic/bosses';
import { Pool } from '../logic/pool';
import type { Enemy, EnemyManager } from './EnemyManager';
import type { Player } from './Player';

const HOMING_RANGE = 220;

export type ProjectileOwner = 'player' | 'enemy';

export interface Projectile {
  x: number; y: number; vx: number; vy: number;
  damage: number; radius: number; life: number;
  owner: ProjectileOwner; key: string; pierce: number;
  /** `now` is the time of impact. */
  onHit?: (target: Enemy | Player, p: Projectile, now: number) => void;
  /** Called when the projectile expires without being used up (e.g. fire breath leaves a zone). */
  onExpire?: (p: Projectile, now: number) => void;
  /** Source label for debug stats ('spit', 'fire', 'ice', ...). */
  source?: string;
  /** Turn rate (rad/s) towards the nearest enemy; flies straight when there is none. */
  homing?: number;
  alive: boolean;
  sprite: Phaser.GameObjects.Sprite;
  hits: number[];
}

export type FireOptions = Omit<Projectile, 'alive' | 'sprite' | 'hits'>;

export class Projectiles {
  /** Called every frame for each live player projectile (visual trails). */
  onTrail: (p: Projectile) => void = () => {};
  private readonly pool: Pool<Projectile>;
  private readonly active: Projectile[] = [];
  private readonly near: number[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.pool = new Pool<Projectile>(
      () => ({
        x: 0, y: 0, vx: 0, vy: 0, damage: 0, radius: 0, life: 0, owner: 'player', key: 'spit', pierce: 0,
        alive: false, hits: [],
        sprite: scene.add.sprite(0, 0, 'spit').setDepth(20).setVisible(false),
      }),
      (p) => { p.alive = false; p.onHit = undefined; p.onExpire = undefined; p.homing = undefined; p.hits.length = 0; p.sprite.setVisible(false).stop(); },
    );
  }

  fire(opts: FireOptions): Projectile {
    const p = this.pool.acquire();
    Object.assign(p, opts);
    p.alive = true;
    p.hits.length = 0;
    p.sprite.setTexture(opts.key, 0).setVisible(true).setPosition(opts.x, opts.y).setRotation(Math.atan2(opts.vy, opts.vx));
    if (this.scene.anims.exists(`${opts.key}_loop`)) p.sprite.play(`${opts.key}_loop`);
    this.active.push(p);
    return p;
  }

  get activeCount(): number { return this.active.length; }
  get createdCount(): number { return this.pool.createdCount; }

  update(dt: number, enemies: EnemyManager, player: Player, now: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      if (p.homing && p.owner === 'player') this.steer(p, enemies, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.sprite.setPosition(p.x, p.y);
      if (p.owner === 'player') this.onTrail(p);
      let spent = false;
      if (p.owner === 'player') {
        enemies.grid.queryRadius(p.x, p.y, p.radius + MAX_ENEMY_RADIUS, this.near);
        for (const idx of this.near) {
          const e = enemies.active[idx];
          if (!e || !e.alive || p.hits.includes(e.id)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) > p.radius + e.radius) continue;
          p.hits.push(e.id);
          enemies.hit(e, p.damage, now, p.source);
          p.onHit?.(e, p, now);
          if (p.hits.length > p.pierce) { spent = true; break; }
        }
      } else if (Math.hypot(player.x - p.x, player.y - p.y) <= p.radius + player.radius) {
        player.damage(p.damage);
        p.onHit?.(player, p, now);
        spent = true;
      }
      if (!spent && p.life <= 0) { p.onExpire?.(p, now); spent = true; }
      if (spent) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        this.pool.release(p);
      }
    }
  }

  private steer(p: Projectile, enemies: EnemyManager, dt: number): void {
    const target = enemies.nearest(p.x, p.y, HOMING_RANGE);
    if (!target) return;
    const speed = Math.hypot(p.vx, p.vy);
    const cur = Math.atan2(p.vy, p.vx);
    let diff = Math.atan2(target.y - p.y, target.x - p.x) - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const a = cur + Math.max(-p.homing! * dt, Math.min(p.homing! * dt, diff));
    p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed;
    p.sprite.setRotation(a);
  }

  clear(): void {
    for (const p of this.active) this.pool.release(p);
    this.active.length = 0;
  }
}

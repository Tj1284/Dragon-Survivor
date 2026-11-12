import * as Phaser from 'phaser';
import { Pool } from '../logic/pool';
import type { Enemy, EnemyManager } from './EnemyManager';
import type { Player } from './Player';

export type ProjectileOwner = 'player' | 'enemy';

export interface Projectile {
  x: number; y: number; vx: number; vy: number;
  damage: number; radius: number; life: number;
  owner: ProjectileOwner; key: string; pierce: number;
  onHit?: (target: Enemy | Player, p: Projectile) => void;
  /** Called when the projectile expires without being used up (e.g. fire breath leaves a zone). */
  onExpire?: (p: Projectile) => void;
  /** Source label for debug stats ('spit', 'fire', 'ice', ...). */
  source?: string;
  alive: boolean;
  sprite: Phaser.GameObjects.Sprite;
  hits: number[];
}

export type FireOptions = Omit<Projectile, 'alive' | 'sprite' | 'hits'>;

export class Projectiles {
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
      (p) => { p.alive = false; p.onHit = undefined; p.onExpire = undefined; p.hits.length = 0; p.sprite.setVisible(false).stop(); },
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
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.sprite.setPosition(p.x, p.y);
      let spent = false;
      if (p.owner === 'player') {
        enemies.grid.queryRadius(p.x, p.y, p.radius + 12, this.near);
        for (const idx of this.near) {
          const e = enemies.active[idx];
          if (!e || !e.alive || p.hits.includes(e.id)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) > p.radius + e.radius) continue;
          p.hits.push(e.id);
          enemies.hit(e, p.damage, now, p.source);
          p.onHit?.(e, p);
          if (p.hits.length > p.pierce) { spent = true; break; }
        }
      } else if (Math.hypot(player.x - p.x, player.y - p.y) <= p.radius + player.radius) {
        player.damage(p.damage);
        p.onHit?.(player, p);
        spent = true;
      }
      if (!spent && p.life <= 0) { p.onExpire?.(p); spent = true; }
      if (spent) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        this.pool.release(p);
      }
    }
  }

  clear(): void {
    for (const p of this.active) this.pool.release(p);
    this.active.length = 0;
  }
}

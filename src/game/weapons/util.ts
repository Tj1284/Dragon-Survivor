import type * as Phaser from 'phaser';
import { AFFINITY, ATTACKS, attackParams, type AttackId, type AttackParams } from '../../logic/attacks';
import type { Enemy } from '../EnemyManager';
import type { Player } from '../Player';
import type { Projectile } from '../Projectiles';
import type { WeaponCtx } from './types';

const scratch: Enemy[] = [];

export function isGold(ctx: WeaponCtx, id: AttackId): boolean {
  return ctx.run.goldAttacks.includes(id);
}

/** Current numbers of an attack, from its level and whether it is gold. */
export function params(ctx: WeaponCtx, id: AttackId): AttackParams {
  return attackParams(id, ctx.run.owned[id] ?? 1, isGold(ctx, id));
}

/** Base damage × player damage × affinity (attacks of the dragon's own element hit harder). */
export function weaponDamage(ctx: WeaponCtx, id: AttackId, base: number): number {
  return base * ctx.player.stats.damageMult * (ATTACKS[id].tag === ctx.run.element ? AFFINITY : 1);
}

/** Damages every enemy within r of (x, y). Returns how many were hit. */
export function explode(ctx: WeaponCtx, x: number, y: number, r: number, damage: number, now: number, source: string): number {
  ctx.enemies.inRadius(x, y, r, scratch);
  for (const e of scratch) ctx.enemies.hit(e, damage, now, source);
  return scratch.length;
}

/** Alive enemies currently inside the camera view. */
export function visibleEnemies(ctx: WeaponCtx, out: Enemy[]): Enemy[] {
  out.length = 0;
  const view = ctx.scene.cameras.main.worldView;
  for (const e of ctx.enemies.active) if (e.alive && view.contains(e.x, e.y)) out.push(e);
  return out;
}

/** Draws a jagged lightning segment. */
export function drawBolt(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, color: number): void {
  const steps = 4;
  g.lineStyle(2, color, 1);
  g.beginPath();
  g.moveTo(x1, y1);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    g.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 8, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 8);
  }
  g.lineTo(x2, y2);
  g.strokePath();
}

export interface FanShot {
  key: string; source: AttackId; count: number; spreadDeg: number; speed: number; damage: number; radius: number; life: number; pierce: number;
  onHit?: (target: Enemy | Player, p: Projectile, now: number) => void;
  onExpire?: (p: Projectile, now: number) => void;
}

/** Fires `count` projectiles from the player in a fan centred on `angle`. */
export function fireFan(ctx: WeaponCtx, angle: number, s: FanShot): void {
  const spread = (s.spreadDeg * Math.PI) / 180;
  for (let i = 0; i < s.count; i++) {
    const a = angle + (i - (s.count - 1) / 2) * spread;
    ctx.projectiles.fire({
      x: ctx.player.x, y: ctx.player.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
      damage: s.damage, radius: s.radius, life: s.life, owner: 'player', key: s.key, pierce: s.pierce, source: s.source,
      onHit: s.onHit, onExpire: s.onExpire,
    });
  }
}

/** Angle from the player to the nearest enemy in range, or null when there is none. */
export function aimAtNearest(ctx: WeaponCtx, range: number): number | null {
  const target = ctx.enemies.nearest(ctx.player.x, ctx.player.y, range);
  return target ? Math.atan2(target.y - ctx.player.y, target.x - ctx.player.x) : null;
}

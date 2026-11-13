import type * as Phaser from 'phaser';
import type { Enemy } from '../EnemyManager';
import type { WeaponCtx } from './types';

const scratch: Enemy[] = [];

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

export function level(ctx: WeaponCtx, id: keyof WeaponCtx['run']['owned']): number {
  return ctx.run.owned[id] ?? 0;
}

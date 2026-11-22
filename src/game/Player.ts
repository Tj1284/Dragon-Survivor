import type * as Phaser from 'phaser';
import { DRAGON_SHEETS } from '../assets/manifest';
import { armorReduce } from '../logic/combat';
import { hitRadius } from './hitRadius';
import { computeStats, type PlayerStats } from '../logic/attacks';
import type { FormId } from '../logic/types';

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  stats: PlayerStats = computeStats(0, {});
  hp = this.stats.maxHp;
  formId: FormId = 'hatchling';
  slowUntil = 0;
  /** Seconds of invulnerability left (after a revive). */
  shield = 0;
  /** Debug only: setHp() above the normal maximum is kept by regen and stat changes. */
  debugHpFloor = 0;
  private r = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x; this.y = y;
    this.sprite = scene.add.sprite(x, y, DRAGON_SHEETS.hatchling.key).setDepth(10);
    this.setForm('hatchling');
  }

  setForm(id: FormId): void {
    const def = DRAGON_SHEETS[id];
    this.formId = id;
    this.sprite.setTexture(def.key, 0);
    this.sprite.play(`${def.key}_loop`);
    this.r = hitRadius(id);
  }

  get radius(): number { return this.r; }

  /** Highest health the dragon can have right now. */
  get hpLimit(): number { return Math.max(this.stats.maxHp, this.debugHpFloor); }

  update(dt: number, move: { x: number; y: number }, now: number): void {
    const speed = this.stats.speed * (now < this.slowUntil ? 0.5 : 1);
    this.x += move.x * speed * dt;
    this.y += move.y * speed * dt;
    if (move.x !== 0) this.sprite.setFlipX(move.x < 0);
    if (this.shield > 0) {
      this.shield = Math.max(0, this.shield - dt);
      this.sprite.setAlpha(this.shield > 0 && Math.floor(this.shield * 10) % 2 === 0 ? 0.4 : 1);
    }
    if (this.hp > 0 && this.stats.regen > 0) this.hp = Math.min(this.hpLimit, this.hp + this.stats.regen * dt);
    this.sprite.setPosition(this.x, this.y);
  }

  damage(amount: number): void {
    if (this.shield > 0) return;
    this.hp = Math.max(0, this.hp - armorReduce(amount, this.stats.armor));
  }
}

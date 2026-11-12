import type * as Phaser from 'phaser';
import { DRAGON_SHEETS } from '../assets/manifest';
import { armorReduce } from '../logic/combat';
import { computeStats, type PlayerStats } from '../logic/stats';
import type { FormId } from '../logic/types';

export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  stats: PlayerStats = computeStats(0, {});
  hp = this.stats.maxHp;
  formId: FormId = 'hatchling';
  slowUntil = 0;
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
    this.r = def.frameWidth * 0.35;
  }

  get radius(): number { return this.r; }

  update(dt: number, move: { x: number; y: number }, now: number): void {
    const speed = this.stats.speed * (now < this.slowUntil ? 0.5 : 1);
    this.x += move.x * speed * dt;
    this.y += move.y * speed * dt;
    if (move.x !== 0) this.sprite.setFlipX(move.x < 0);
    if (this.hp > 0 && this.stats.regen > 0) this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.regen * dt);
    this.sprite.setPosition(this.x, this.y);
  }

  damage(amount: number): void {
    this.hp = Math.max(0, this.hp - armorReduce(amount, this.stats.armor));
  }
}

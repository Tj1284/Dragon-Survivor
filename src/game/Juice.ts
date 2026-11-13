import * as Phaser from 'phaser';
import { COLORS } from '../assets/manifest';
import type { Element } from '../logic/types';
import type { Player } from './Player';

/** Visual feedback that doesn't affect the rules: sparks, puffs, screen shake, hurt flash, aura, vignette. */
export class Juice {
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly puffs: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly aura: Phaser.GameObjects.Image;
  private readonly vignette: Phaser.GameObjects.Image;
  private readonly hurtFlash: Phaser.GameObjects.Rectangle;
  private sparksThisFrame = 0;
  private lastHp = -1;
  private shakeReadyAt = 0;
  private t = 0;

  constructor(private readonly scene: Phaser.Scene, private readonly player: Player) {
    this.sparks = scene.add.particles(0, 0, 'px', {
      speed: { min: 30, max: 90 }, lifespan: { min: 150, max: 300 }, scale: { start: 1, end: 0 },
      tint: [0xffffff, 0xfff2a8], emitting: false,
    }).setDepth(35);
    this.puffs = scene.add.particles(0, 0, 'glow', {
      speed: { min: 8, max: 30 }, lifespan: 450, scale: { start: 0.22, end: 0.4 }, alpha: { start: 0.55, end: 0 },
      tint: 0xcfc8d8, emitting: false,
    }).setDepth(4);
    this.aura = scene.add.image(0, 0, 'glow').setDepth(9).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    const { width, height } = scene.scale.gameSize;
    this.vignette = scene.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(450);
    this.hurtFlash = scene.add.rectangle(0, 0, width, height, 0xff2030, 0).setOrigin(0).setScrollFactor(0).setDepth(451);
    this.layout(width, height);
  }

  layout(width: number, height: number): void {
    this.vignette.setDisplaySize(width, height);
    this.hurtFlash.setSize(width, height);
  }

  hit(x: number, y: number): void {
    if (this.sparksThisFrame >= 6) return; // keep big fights cheap
    this.sparksThisFrame++;
    this.sparks.explode(3, x, y);
  }

  death(x: number, y: number): void {
    this.puffs.explode(4, x, y);
  }

  setElement(element: Element | null, stage: number): void {
    if (!element || stage === 0) { this.aura.setVisible(false); return; }
    this.aura.setVisible(true).setTint(COLORS[element]).setScale(0.8 + stage * 0.35);
  }

  update(dt: number, now: number): void {
    this.sparksThisFrame = 0;
    this.t += dt;
    const p = this.player;
    this.aura.setPosition(p.x, p.y).setAlpha(0.35 + Math.sin(this.t * 3) * 0.1);
    if (this.lastHp >= 0 && p.hp < this.lastHp - 0.01) {
      p.sprite.setTint(0xff6060);
      this.scene.time.delayedCall(90, () => p.sprite.clearTint());
      this.hurtFlash.setAlpha(0.18);
      if (now >= this.shakeReadyAt) {
        this.scene.cameras.main.shake(90, 0.004);
        this.shakeReadyAt = now + 0.35;
      }
    }
    if (this.hurtFlash.alpha > 0) this.hurtFlash.setAlpha(Math.max(0, this.hurtFlash.alpha - dt * 0.9));
    this.lastHp = p.hp;
  }
}

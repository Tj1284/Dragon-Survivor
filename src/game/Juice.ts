import * as Phaser from 'phaser';
import { COLORS } from '../assets/manifest';
import type { Element, Tag } from '../logic/types';
import { isAttack, tagOf, type UpgradeId } from '../logic/attacks';
import type { Player } from './Player';
import { audio } from '../audio';

type EmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

/** Ambient particles around an evolved dragon, by element. */
const AMBIENT: Record<Element, EmitterConfig> = {
  fire: { speedX: { min: -8, max: 8 }, speedY: { min: -40, max: -18 }, lifespan: { min: 350, max: 650 }, scale: { start: 2, end: 0 }, tint: [0xffd34a, 0xff8a2a, 0xe8542a], blendMode: 'ADD' },
  ice: { speedX: { min: -10, max: 10 }, speedY: { min: 6, max: 18 }, lifespan: { min: 600, max: 1000 }, scale: { start: 1.5, end: 0.5 }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xb2e9ff] },
  lightning: { speed: { min: 40, max: 80 }, lifespan: { min: 90, max: 180 }, scale: { start: 1.5, end: 0 }, tint: [0xfff27a, 0xffffff], blendMode: 'ADD' },
  poison: { speedX: { min: -6, max: 6 }, speedY: { min: -16, max: -6 }, lifespan: { min: 600, max: 900 }, scale: { start: 1, end: 2.5 }, alpha: { start: 0.9, end: 0 }, tint: [0x8fe04a, 0xb8f07a, 0x6ab030] },
  shadow: { speedX: { min: -6, max: 6 }, speedY: { min: -14, max: -4 }, lifespan: { min: 500, max: 900 }, scale: { start: 2.5, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0x5a3f7a, 0x2a2238, 0xff3d7f] },
};
/** Ambient particles per second at each stage (hatchling has none). */
const AMBIENT_RATE = [0, 8, 14, 22];
const TRAIL_KEYS = new Set(['fire_orb', 'ice_shard', 'poison_glob', 'shadow_bolt', 'spit']);
const MAX_TRAILS_PER_FRAME = 24;

/** Visual feedback that doesn't affect the rules: sparks, puffs, screen shake, hurt flash, aura, vignette. */
export class Juice {
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly tagSparks = new Map<Tag, Phaser.GameObjects.Particles.ParticleEmitter>();
  private readonly trails = new Map<Tag, Phaser.GameObjects.Particles.ParticleEmitter>();
  private ambient: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private ambientRate = 0;
  private ambientAcc = 0;
  private trailsThisFrame = 0;
  private trailFrame = 0;
  private readonly shadow: Phaser.GameObjects.Image;
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
    this.shadow = scene.add.image(0, 0, 'glow').setDepth(4).setTint(0x000000).setAlpha(0.35).setScale(0.45, 0.16);
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

  /** Full-screen flash that fades out (camera.flash is unavailable in this Phaser build). */
  flash(color: number, alpha = 0.6): void {
    this.hurtFlash.setFillStyle(color, 1).setAlpha(alpha);
    this.scene.time.delayedCall(400, () => this.hurtFlash.setFillStyle(0xff2030, 1));
  }

  /** Impact sparks, in the colour of the attack's element when `source` is an attack. */
  hit(x: number, y: number, source?: string): void {
    if (this.sparksThisFrame >= 6) return; // keep big fights cheap
    this.sparksThisFrame++;
    const tag = tagOfSource(source);
    if (!tag || tag === 'neutral') { this.sparks.explode(3, x, y); return; }
    this.sparkEmitter(tag).explode(3, x, y);
  }

  /** A short glowing trail behind a player projectile. */
  trail(x: number, y: number, key: string, source?: string): void {
    if (!TRAIL_KEYS.has(key) || this.trailsThisFrame >= MAX_TRAILS_PER_FRAME || (this.trailFrame & 1)) return;
    this.trailsThisFrame++;
    this.trailEmitter(tagOfSource(source) ?? 'neutral').emitParticleAt(x, y, 1);
  }

  private sparkEmitter(tag: Tag): Phaser.GameObjects.Particles.ParticleEmitter {
    let e = this.tagSparks.get(tag);
    if (!e) {
      e = this.scene.add.particles(0, 0, 'px', {
        speed: { min: 30, max: 90 }, lifespan: { min: 150, max: 300 }, scale: { start: 1.5, end: 0 },
        tint: [0xffffff, COLORS[tag]], emitting: false,
      }).setDepth(35);
      this.tagSparks.set(tag, e);
    }
    return e;
  }

  private trailEmitter(tag: Tag): Phaser.GameObjects.Particles.ParticleEmitter {
    let e = this.trails.get(tag);
    if (!e) {
      e = this.scene.add.particles(0, 0, 'px', {
        speed: { min: 0, max: 6 }, lifespan: 220, scale: { start: 2, end: 0 }, alpha: { start: 0.8, end: 0 },
        tint: COLORS[tag], blendMode: 'ADD', emitting: false,
      }).setDepth(19);
      this.trails.set(tag, e);
    }
    return e;
  }

  death(x: number, y: number): void {
    this.puffs.explode(4, x, y);
  }

  setElement(element: Element | null, stage: number): void {
    this.ambient?.destroy();
    this.ambient = null;
    this.ambientRate = 0;
    if (!element || stage === 0) { this.aura.setVisible(false); return; }
    this.aura.setVisible(true).setTint(COLORS[element]).setScale(0.8 + stage * 0.35);
    this.ambient = this.scene.add.particles(0, 0, 'px', { ...AMBIENT[element], emitting: false }).setDepth(11);
    this.ambientRate = AMBIENT_RATE[stage] ?? 0;
  }

  /** Number of ambient particles alive (debug). */
  get ambientAlive(): number { return this.ambient?.getAliveParticleCount() ?? 0; }

  update(dt: number, now: number): void {
    this.sparksThisFrame = 0;
    this.trailsThisFrame = 0;
    this.trailFrame++;
    this.t += dt;
    const p = this.player;
    const half = p.sprite.displayHeight / 2;
    this.shadow.setPosition(p.x, p.y + half * 0.85).setScale(0.25 + p.sprite.displayWidth / 220, 0.1 + p.sprite.displayWidth / 900);
    if (this.ambient && this.ambientRate > 0) {
      this.ambientAcc += dt * this.ambientRate;
      const w = p.sprite.displayWidth * 0.4;
      while (this.ambientAcc >= 1) {
        this.ambientAcc -= 1;
        this.ambient.emitParticleAt(p.x + (Math.random() - 0.5) * w * 2, p.y + (Math.random() - 0.5) * half, 1);
      }
    }
    this.aura.setPosition(p.x, p.y).setAlpha(0.35 + Math.sin(this.t * 3) * 0.1);
    if (this.lastHp >= 0 && p.hp < this.lastHp - 0.01) {
      p.sprite.setTint(0xff6060);
      audio.play('hurt');
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

function tagOfSource(source?: string): Tag | null {
  if (!source) return null;
  if (source === 'poison') return 'poison';
  return isAttack(source as UpgradeId) ? tagOf(source as UpgradeId) : null;
}

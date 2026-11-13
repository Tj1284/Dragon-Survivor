import * as Phaser from 'phaser';
import { COLORS } from '../assets/manifest';
import { PLAYER_WEAPONS } from '../config/balance';
import { chooseElement, formId, stageForLevel } from '../logic/evolution';
import type { Element, Stage } from '../logic/types';
import type { Enemy } from './EnemyManager';
import type { WeaponCtx } from './weapons/types';

function ensurePixel(scene: Phaser.Scene): string {
  if (!scene.textures.exists('px')) {
    const tex = scene.textures.createCanvas('px', 2, 2)!;
    tex.getContext().fillStyle = '#ffffff';
    tex.getContext().fillRect(0, 0, 2, 2);
    tex.refresh();
  }
  return 'px';
}

export class Evolution {
  count = 0;
  private busy: Promise<boolean> | null = null;
  private readonly near: Enemy[] = [];

  constructor(
    private readonly ctx: WeaponCtx,
    private readonly onElementNeeded: () => Promise<Element>,
    private readonly onEvolved: (from: Stage, to: Stage) => void,
  ) {}

  /** Evolves straight to the highest stage reached, with a single animation. True if it evolved. */
  check(): Promise<boolean> {
    if (!this.busy) this.busy = this.run().finally(() => { this.busy = null; });
    return this.busy;
  }

  private async run(): Promise<boolean> {
    const { run, player } = this.ctx;
    const stage = stageForLevel(run.level);
    if (stage <= run.stage) return false;
    if (run.element === null) {
      const choice = chooseElement(run.picks);
      run.element = choice === 'choose' ? await this.onElementNeeded() : choice;
    }
    const from = run.stage;
    run.stage = stage;
    player.setForm(formId(stage, run.element));
    this.count++;
    this.onEvolved(from, stage);
    this.play(run.element);
    return true;
  }

  private play(element: Element): void {
    const { scene, player, enemies } = this.ctx;
    const E = PLAYER_WEAPONS.evolution;
    const sprite = player.sprite;
    sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    scene.time.delayedCall(180, () => sprite.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    sprite.setScale(1.4);
    scene.tweens.add({ targets: sprite, scale: 1, duration: 450, ease: 'Back.Out' });

    const particles = scene.add.particles(player.x, player.y, ensurePixel(scene), {
      speed: { min: 40, max: 140 }, lifespan: 600, scale: { start: 2, end: 0 }, tint: COLORS[element], emitting: false,
    }).setDepth(40);
    particles.explode(40);
    scene.time.delayedCall(800, () => particles.destroy());

    const ring = scene.add.circle(player.x, player.y, 8, COLORS[element], 0).setStrokeStyle(3, COLORS[element], 1).setDepth(39);
    scene.tweens.add({ targets: ring, radius: E.pushRadius, alpha: 0, duration: 400, onComplete: () => ring.destroy() });

    enemies.inRadius(player.x, player.y, E.pushRadius, this.near);
    for (const e of this.near) {
      const dx = e.x - player.x, dy = e.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * E.pushDistance;
      e.y += (dy / d) * E.pushDistance;
    }
  }
}

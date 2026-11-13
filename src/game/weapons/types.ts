import type * as Phaser from 'phaser';
import type { EnemyManager } from '../EnemyManager';
import type { Player } from '../Player';
import type { Projectiles } from '../Projectiles';
import type { RunState } from '../RunState';

export interface Weapon { update(dt: number, now: number): void; destroy(): void }

export interface WeaponCtx { scene: Phaser.Scene; player: Player; enemies: EnemyManager; projectiles: Projectiles; run: RunState }

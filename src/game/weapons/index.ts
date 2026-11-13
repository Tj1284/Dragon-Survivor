import type { Element } from '../../logic/types';
import { FireBreath } from './FireBreath';
import { FireOrbit } from './FireOrbit';
import { FrostAura } from './FrostAura';
import { FrostShards } from './FrostShards';
import { IceBreath } from './IceBreath';
import { LightningBreath } from './LightningBreath';
import { ThunderStrike } from './ThunderStrike';
import type { Weapon, WeaponCtx } from './types';
import { Ultimate } from './Ultimate';

export function createBreath(ctx: WeaponCtx, element: Element): Weapon {
  if (element === 'fire') return new FireBreath(ctx);
  if (element === 'ice') return new IceBreath(ctx);
  return new LightningBreath(ctx);
}

export type ElementWeaponId = 'fire_orbit' | 'frost_shards' | 'thunder_strike' | 'frost_aura';

export function createElementWeapon(ctx: WeaponCtx, id: ElementWeaponId): Weapon {
  if (id === 'fire_orbit') return new FireOrbit(ctx);
  if (id === 'frost_shards') return new FrostShards(ctx);
  if (id === 'frost_aura') return new FrostAura(ctx);
  return new ThunderStrike(ctx);
}

export function createUltimate(ctx: WeaponCtx, element: Element): Weapon {
  return new Ultimate(ctx, element);
}

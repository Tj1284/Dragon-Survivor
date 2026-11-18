import type { AttackId } from '../../logic/attacks';
import type { Element } from '../../logic/types';
import { FireBreath } from './FireBreath';
import { FireOrbit } from './FireOrbit';
import { FrostAura } from './FrostAura';
import { FrostShards } from './FrostShards';
import { IceBreath } from './IceBreath';
import { LightningBreath } from './LightningBreath';
import { Meteor } from './Meteor';
import { Roar } from './Roar';
import { Spit } from './Spit';
import { StaticField } from './StaticField';
import { TailSwipe } from './TailSwipe';
import { ThunderStrike } from './ThunderStrike';
import type { Weapon, WeaponCtx } from './types';
import { Ultimate } from './Ultimate';

const FACTORY: Record<AttackId, new (ctx: WeaponCtx) => Weapon> = {
  spit: Spit,
  tail_swipe: TailSwipe,
  roar: Roar,
  meteor: Meteor,
  static_field: StaticField,
  fire_breath: FireBreath,
  fire_orbit: FireOrbit,
  ice_breath: IceBreath,
  frost_shards: FrostShards,
  frost_aura: FrostAura,
  lightning_breath: LightningBreath,
  thunder_strike: ThunderStrike,
};

export function createAttack(ctx: WeaponCtx, id: AttackId): Weapon {
  return new FACTORY[id](ctx);
}

export function createUltimate(ctx: WeaponCtx, element: Element): Weapon {
  return new Ultimate(ctx, element);
}

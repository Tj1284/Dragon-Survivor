export type BossId = 'captain' | 'champion' | 'grand_hunter';
export type BossPattern = 'charge' | 'slam' | 'summon';

export interface BossDef {
  id: BossId;
  /** Seconds into the run when it appears. */
  at: number;
  hp: number;
  sprite: 'heavy' | 'lancer' | 'boss';
  scale: number; radius: number; speed: number; damage: number;
  patterns: BossPattern[];
  /** Beating the final boss wins the run; the others drop a chest. */
  final: boolean;
}

export const BOSSES: BossDef[] = [
  { id: 'captain', at: 180, hp: 900, sprite: 'heavy', scale: 2, radius: 20, speed: 34, damage: 15, patterns: ['charge'], final: false },
  { id: 'champion', at: 360, hp: 2800, sprite: 'lancer', scale: 2, radius: 22, speed: 38, damage: 18, patterns: ['charge', 'slam'], final: false },
  { id: 'grand_hunter', at: 600, hp: 9000, sprite: 'boss', scale: 1, radius: 34, speed: 32, damage: 22, patterns: ['charge', 'slam', 'summon'], final: true },
];

export const BOSS_AI = {
  every: 3.5,
  /** A boss only starts a pattern when the dragon is this close (on screen). */
  patternRange: 220,
  charge: { windup: 0.6, time: 1, speed: 170 },
  slam: { radius: 70, delay: 0.9, damage: 25 },
  summon: { count: 8, ring: 90 },
  contactCooldown: 0.6,
  victoryGold: 50,
  victoryDelay: 1.5,
};

/** Biggest collision radius of any enemy, bosses included: spatial-grid queries must pad by this. */
export const MAX_ENEMY_RADIUS = Math.max(...BOSSES.map((b) => b.radius), 12);

/** Bosses whose time has come and that haven't appeared yet, in order. */
export function bossesDue(elapsed: number, spawned: ReadonlySet<string>): BossDef[] {
  return BOSSES.filter((b) => elapsed >= b.at && !spawned.has(b.id));
}

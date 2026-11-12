export function xpToNext(level: number): number {
  return 5 + 4 * (level - 1);
}

export function applyXp(s: { level: number; xp: number }, gained: number): { level: number; xp: number; levelsGained: number } {
  let level = s.level;
  let xp = s.xp + gained;
  let levelsGained = 0;
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level++;
    levelsGained++;
  }
  return { level, xp, levelsGained };
}

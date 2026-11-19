/** Every sound effect, by name; each one is audio/sfx/<name>.mp3 (CC0, see docs/CREDITS.md). */
export const SFX_NAMES = ['hit', 'kill', 'gem', 'gold', 'levelup', 'evolve', 'pick', 'hurt', 'boss', 'slam', 'chest', 'victory', 'defeat', 'click'] as const;
export type SfxName = (typeof SFX_NAMES)[number];

/** Per-effect volume: frequent sounds are quieter so they don't cover the rare, important ones. */
export const SFX_VOLUME: Record<SfxName, number> = {
  hit: 0.25, kill: 0.35, gem: 0.3, gold: 0.4, levelup: 0.7, evolve: 0.8, pick: 0.5, hurt: 0.6,
  boss: 0.7, slam: 0.7, chest: 0.7, victory: 0.8, defeat: 0.7, click: 0.4,
};

/** Music tracks, each audio/music/<name>.mp3. */
export const MUSIC_TRACKS = ['title', 'level1', 'level2', 'level3', 'ending'] as const;
export type MusicTrack = (typeof MUSIC_TRACKS)[number];

export const MUSIC_VOLUME = 0.45;

import * as Phaser from 'phaser';
import { installDebug, registerDebug } from './debug';
import { computeGameSize } from './logic/viewport';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { PauseScene } from './scenes/PauseScene';
import { MenuScene } from './scenes/MenuScene';
import { LairScene } from './scenes/LairScene';
import { CollectionScene } from './scenes/CollectionScene';
import { storage } from './platform/storage';
import { audio } from './audio';
import { defaultSave, type SaveData } from './logic/save';
import { setLanguage } from './i18n';
import { initStorage } from './platform/storage';
import { platform } from './platform/bridge';
import '@fontsource/silkscreen/400.css';

// Playgama order: SDK ready → language → save → engine
await platform.init();
setLanguage(platform.language);
await initStorage();

async function waitForFont(): Promise<void> {
  try {
    await Promise.race([document.fonts.load('16px "Silkscreen"'), new Promise((r) => setTimeout(r, 1500))]);
  } catch { /* fall back to monospace */ }
}

await waitForFont();

const initial = computeGameSize(window.innerWidth, window.innerHeight);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1b2a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initial.width,
    height: initial.height,
  },
  scene: [BootScene, MenuScene, LairScene, CollectionScene, GameScene, LevelUpScene, PauseScene, GameOverScene],
});

installDebug(game);
registerDebug('scene', () => game.scene.getScenes(true).map((sc) => sc.scene.key));
audio.setMuted(storage.load().muted);

// Playgama: start muted if the platform says so, and follow its pause/audio requests (ads, tab switches).
// game.pause() stops the whole loop without touching scenes the player paused (pause menu, level-up), so resuming is safe.
function applyPlatformAudio(enabled: boolean): void { audio.setPlatformMuted(!enabled); }
function applyPlatformPause(paused: boolean): void {
  audio.setPlatformPaused(paused);
  if (paused) game.pause(); else game.resume();
}
applyPlatformAudio(platform.audioEnabled);
platform.onAudio(applyPlatformAudio);
platform.onPause(applyPlatformPause);
registerDebug('platformAudio', applyPlatformAudio);
registerDebug('platformPause', applyPlatformPause);
registerDebug('gamePaused', () => game.isPaused);
registerDebug('audio', () => audio.stats());
registerDebug('save', () => storage.load());
registerDebug('resetSave', () => storage.save(defaultSave()));
registerDebug('setSave', (partial: Partial<SaveData>) => storage.save({ ...storage.load(), ...partial }));
registerDebug('size', () => ({ width: game.scale.gameSize.width, height: game.scale.gameSize.height }));

window.addEventListener('resize', () => {
  const size = computeGameSize(window.innerWidth, window.innerHeight);
  if (size.width !== game.scale.gameSize.width || size.height !== game.scale.gameSize.height) {
    game.scale.setGameSize(size.width, size.height);
  }
});

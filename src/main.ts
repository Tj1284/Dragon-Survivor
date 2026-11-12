import * as Phaser from 'phaser';
import { installDebug, registerDebug } from './debug';
import { computeGameSize } from './logic/viewport';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { setLanguage } from './i18n';

setLanguage(navigator.language || 'en');

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
  scene: [BootScene, GameScene, GameOverScene],
});

installDebug(game);
registerDebug('scene', () => game.scene.getScenes(true).map((sc) => sc.scene.key));
registerDebug('size', () => ({ width: game.scale.gameSize.width, height: game.scale.gameSize.height }));

window.addEventListener('resize', () => {
  const size = computeGameSize(window.innerWidth, window.innerHeight);
  if (size.width !== game.scale.gameSize.width || size.height !== game.scale.gameSize.height) {
    game.scale.setGameSize(size.width, size.height);
  }
});

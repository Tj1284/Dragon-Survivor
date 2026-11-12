import * as Phaser from 'phaser';
import { setDebugReady } from '../debug';

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  create(): void {
    this.add.text(8, 8, 'Dragones', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' });
    setDebugReady(true);
  }
}

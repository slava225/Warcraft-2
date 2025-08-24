// Game configuration and main entry point
import { GameScene } from './scenes/GameScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MobileControls } from './controls/MobileControls.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    canvas: document.getElementById('game-canvas'),
    width: 1280,
    height: 720,
    backgroundColor: '#2a2a2a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    scene: [PreloadScene, GameScene]
};

// Initialize game
const game = new Phaser.Game(config);

// Initialize mobile controls
const mobileControls = new MobileControls();

// Make mobile controls available globally
window.mobileControls = mobileControls;

// Hide loading screen when game is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1000);
});
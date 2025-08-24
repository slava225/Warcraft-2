// Game configuration and main entry point
import { GameScene } from './scenes/GameScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MobileControls } from './controls/MobileControls.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    // Game configuration
    const config = {
        type: Phaser.WEBGL,
        parent: 'game-container',
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a1a',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        },
        audio: {
            disableWebAudio: false,
            noAudio: false
        },
        scene: [PreloadScene, GameScene],
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false,
            transparent: false
        },
        fps: {
            target: 60,
            forceSetTimeOut: false
        },
        input: {
            activePointers: 3,
            smoothFactor: 0
        }
    };

    // Initialize game
    const game = new Phaser.Game(config);

    // Initialize mobile controls
    const mobileControls = new MobileControls();

    // Make mobile controls available globally
    window.mobileControls = mobileControls;

    // Hide loading screen when game is ready
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 2000);
});
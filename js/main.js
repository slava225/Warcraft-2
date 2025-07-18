// Основной модуль игры Warcraft 2D
import { Game } from './game.js';
import { MobileControls } from './mobile-controls.js';
import { AssetLoader } from './asset-loader.js';

class WarcraftApp {
    constructor() {
        this.game = null;
        this.mobileControls = null;
        this.canvas = null;
        this.ctx = null;
        this.isLoaded = false;
        this.loadingProgress = 0;
    }

    async init() {
        try {
            // Инициализация канваса
            this.setupCanvas();
            
            // Показываем загрузочный экран
            this.showLoadingScreen();
            
            // Загружаем ресурсы
            await this.loadAssets();
            
            // Инициализируем игру
            this.initGame();
            
            // Инициализируем мобильные элементы управления
            this.initMobileControls();
            
            // Устанавливаем обработчики событий
            this.setupEventListeners();
            
            // Скрываем загрузочный экран
            this.hideLoadingScreen();
            
            // Запускаем игровой цикл
            this.startGameLoop();
            
            console.log('Игра успешно инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
            this.showError('Ошибка загрузки игры');
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Настраиваем размеры канваса под экран
        this.resizeCanvas();
        
        // Отключаем сглаживание для пиксельной графики
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    updateLoadingProgress(progress) {
        this.loadingProgress = progress;
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    async loadAssets() {
        const assetLoader = new AssetLoader();
        
        // Список ресурсов для загрузки
        const assets = [
            'sprites/units.png',
            'sprites/buildings.png',
            'sprites/terrain.png',
            'sprites/ui.png',
            'audio/music.mp3',
            'audio/sounds.mp3'
        ];

        let loaded = 0;
        
        for (const asset of assets) {
            try {
                await assetLoader.load(asset);
                loaded++;
                this.updateLoadingProgress((loaded / assets.length) * 100);
            } catch (error) {
                console.warn(`Не удалось загрузить ресурс: ${asset}`);
            }
        }
    }

    initGame() {
        const gameConfig = {
            canvas: this.canvas,
            ctx: this.ctx,
            width: this.canvas.width,
            height: this.canvas.height,
            isMobile: this.isMobileDevice()
        };

        this.game = new Game(gameConfig);
    }

    initMobileControls() {
        if (this.isMobileDevice()) {
            this.mobileControls = new MobileControls(this.game);
        }
    }

    setupEventListeners() {
        // Изменение размера окна
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            if (this.game) {
                this.game.handleResize();
            }
        });

        // Предотвращение масштабирования на мобильных устройствах
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - this.lastTouchEnd <= 300) {
                e.preventDefault();
            }
            this.lastTouchEnd = now;
        }, { passive: false });

        // Обработка потери фокуса
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.game) {
                this.game.pause();
            } else if (this.game) {
                this.game.resume();
            }
        });

        // Кнопки меню
        const resumeBtn = document.getElementById('resumeBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const exitBtn = document.getElementById('exitBtn');

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.resume();
                }
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                // TODO: Открыть настройки
                console.log('Настройки');
            });
        }

        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (confirm('Выйти из игры?')) {
                    window.close();
                }
            });
        }
    }

    startGameLoop() {
        const loop = (timestamp) => {
            if (this.game && !this.game.isPaused) {
                this.game.update(timestamp);
                this.game.render(this.ctx);
            }
            requestAnimationFrame(loop);
        };
        
        requestAnimationFrame(loop);
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    showError(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingContent = loadingScreen.querySelector('.loading-content');
        
        if (loadingContent) {
            loadingContent.innerHTML = `
                <h1>Ошибка</h1>
                <p>${message}</p>
                <button onclick="location.reload()">Перезагрузить</button>
            `;
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new WarcraftApp();
    app.init();
});

// Экспорт для использования в других модулях
export { WarcraftApp };
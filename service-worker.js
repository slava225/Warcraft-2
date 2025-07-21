const CACHE_NAME = 'warcraft2-v1.1';

// Определяем базовый путь
const isGitHubPages = location.hostname === 'slava225.github.io';
const basePath = isGitHubPages ? '/Warcraft-2' : '.';

const urlsToCache = [
    `${basePath}/`,
    `${basePath}/index.html`,
    `${basePath}/styles.css`,
    `${basePath}/manifest.json`,
    `${basePath}/js/main.js`,
    `${basePath}/js/game.js`,
    `${basePath}/js/entity-manager.js`,
    `${basePath}/js/entities/unit.js`,
    `${basePath}/js/entities/building.js`,
    `${basePath}/js/input-manager.js`,
    `${basePath}/js/mobile-controls.js`,
    `${basePath}/js/audio-manager.js`,
    `${basePath}/js/camera.js`,
    `${basePath}/js/ui.js`,
    `${basePath}/js/world-map.js`,
    `${basePath}/js/sprite-generator.js`,
    `${basePath}/js/sound-generator.js`,
    `${basePath}/js/game-improvements.js`
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кеширование файлов');
                return cache.addAll(urlsToCache);
            })
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кешированную версию или загружаем из сети
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Обновление кеша
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
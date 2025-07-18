const CACHE_NAME = 'warcraft2d-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/js/main.js',
  '/js/game.js',
  '/js/mobile-controls.js',
  '/js/asset-loader.js',
  '/js/world-map.js',
  '/js/entity-manager.js',
  '/js/resource-manager.js',
  '/js/camera.js',
  '/js/input-manager.js',
  '/js/ui.js',
  '/js/audio-manager.js',
  '/js/entities/unit.js',
  '/js/entities/building.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Кеширование файлов');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кеша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кешированную версию или загружаем из сети
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ для кеширования
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Возвращаем оффлайн страницу для HTML запросов
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Обработка push уведомлений (опционально)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новые обновления в игре!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Играть',
        icon: '/icons/icon-72.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon-72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Warcraft 2D', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
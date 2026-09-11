const CACHE_NAME = 'cleantech-pwa-v3';

// Recursos essenciais para pré-cache da casca do app
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Falha no pré-cache PWA:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia: Network First com fallback para Cache para navegação e ícones
self.addEventListener('fetch', event => {
  // Ignora requisições não GET ou extensões do Chrome
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Não intercepta chamadas de API do backend
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida e for asset estático, atualiza cache
        if (response.status === 200 && (event.request.url.includes('/icons/') || event.request.url.endsWith('manifest.json'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Se offline, tenta retornar do cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

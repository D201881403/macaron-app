/* ============================================
   马卡龙空间 — Service Worker
   提供离线缓存和 PWA 完整支持
   ============================================ */

const CACHE_NAME = 'macaron-space-v2';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json'
];

// 安装：预缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map(url =>
        cache.add(url).catch(() => {})
      ));
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先（静态资源），网络优先（其他）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // 跳过非 GET 请求和 chrome-extension
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // 有缓存直接返回，同时后台更新
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

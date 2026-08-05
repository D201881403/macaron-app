/* ============================================
   马卡龙空间 — Service Worker v6
   提供离线缓存 + 网络优先更新策略
   ============================================ */

const CACHE_NAME = 'macaron-space-v6';
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

// 请求拦截：网络优先（确保获取最新版本），离线时回退缓存
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;

  // 对于 HTML 文件：网络优先（确保总是最新版本）
  if (request.destination === 'document' || request.url.endsWith('.html') || request.url.endsWith('/')) {
    event.respondWith(
      fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // 其他资源：缓存优先，后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
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

// 监听来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

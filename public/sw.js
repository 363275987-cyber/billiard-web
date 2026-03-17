const CACHE_NAME = 'billiard-train-v1';
const BASE = '/billiard-web/';

const PRECACHE_URLS = [
  BASE,
  BASE + 'manifest.json',
];

// 安装时预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 请求策略：API 走网络，静态资源走缓存优先
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Supabase API 请求不缓存，直接走网络
  if (url.hostname === 'cmswoyiuoeqzeassubvw.supabase.co') {
    return;
  }
  
  // 静态资源：缓存优先，网络回退
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // 缓存成功的静态资源响应
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(() => {
      // 离线时返回缓存首页
      if (event.request.mode === 'navigate') {
        return caches.match(BASE);
      }
    })
  );
});

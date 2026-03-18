const CACHE_NAME = 'billiard-train-v2';
const BASE = '/billiard-web/';

// 安装时只缓存静态资源骨架
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 激活时清理所有旧缓存，强制更新
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 请求策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase API 不缓存
  if (url.hostname === 'cmswoyiuoeqzeassubvw.supabase.co') {
    return;
  }

  // HTML 页面：网络优先（确保每次拿到最新入口）
  if (event.request.mode === 'navigate' ||
      (url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // JS/CSS/图片：网络优先，失败用缓存
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

const CACHE = 'tokyo-trip-2026-v49';
// HTML 與資料檔（places/itinerary）不放入快取，永遠從網路取最新版
const STATIC = ['/style.css?v=49', '/app.js?v=49', '/manifest.json', '/icon.svg'];
// 這些路徑永遠走 network-first（即時反映 CSV / 行程更新）
const NETWORK_FIRST = ['/places.json', '/itinerary.json', '/expenses.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;
  // HTML 與資料檔：network-first（拿不到才用快取備援）
  const isHtml = e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isData = NETWORK_FIRST.includes(url.pathname);
  if (isHtml || isData) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok && isData) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // JS/CSS/圖示：cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
    })
  );
});

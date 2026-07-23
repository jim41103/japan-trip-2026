const CACHE = 'tokyo-trip-2026-v97';
const TILE_CACHE = 'tokyo-osm-tiles-v1';
// HTML 與資料檔不放入主快取，永遠從網路取最新版
// 注意：每次改 app.js/style.css 都必須同步 bump 此處與 index.html 的 ?v=，否則 cache-first 會讓舊客戶端永遠拿不到新版
const STATIC = ['/style.css?v=97', '/app.js?v=97', '/manifest.json', '/icon.png'];
// 這些路徑永遠走 network-first（即時反映 CSV / 行程更新）
const NETWORK_FIRST = ['/places.json', '/itinerary.json', '/expenses.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;

  // OSM 地圖瓦片：cache-first（讓地鐵無訊號時仍可看地圖）
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async c => {
        const cached = await c.match(e.request);
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

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

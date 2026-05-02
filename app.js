// ════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════
const HOTEL = {
  name: '淺草田原町站前APA飯店',
  description: '住宿', lat: 35.710269, lng: 139.7901016, type: 'hotel',
};
const NEARBY_RADIUS_KM = 1.0;
const DAY_SHORT = {
  '2026-08-03': '8/3 (一)', '2026-08-04': '8/4 (二)',
  '2026-08-05': '8/5 (三)', '2026-08-06': '8/6 (四)',
  '2026-08-07': '8/7 (五)', '2026-08-08': '8/8 (六)',
};
const CAT_EMOJI  = { food:'🍽', ticket:'🎫', transport:'🚌', shopping:'🛍', hotel:'🏨', medicine:'💊', other:'📦' };
const CAT_LABEL  = { food:'餐飲', ticket:'票券', transport:'交通', shopping:'購物', hotel:'住宿', medicine:'藥妝', other:'其他' };
const SHOP_CAT   = { medicine:'💊 藥妝', food:'🍬 食品/零食', fashion:'👗 服飾', souvenir:'🎁 伴手禮', other:'📦 其他' };

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let allPlaces = [], filteredPlaces = [], itinerary = {}, notionPages = [], expenses = [];
let markers = {}, activeFilter = 'all', activeNotionTab = 0;
let shopItems = JSON.parse(localStorage.getItem('shopItems') || 'null') || defaultShopItems();

// ════════════════════════════════════════════
//  SPLASH
// ════════════════════════════════════════════
setTimeout(() => {
  const s = document.getElementById('splash');
  if (!s) return;
  s.classList.add('splitting');
  setTimeout(() => s.remove(), 750);
}, 2800);

// ════════════════════════════════════════════
//  SERVICE WORKER
// ════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ════════════════════════════════════════════
//  WEATHER  (Open-Meteo — free, no API key)
// ════════════════════════════════════════════
const WMO = {
  0:['☀️','晴'], 1:['🌤','晴時多雲'], 2:['⛅','多雲'], 3:['☁️','陰'],
  45:['🌫','霧'], 48:['🌫','霧凇'],
  51:['🌦','毛毛雨'], 53:['🌦','毛毛雨'], 55:['🌦','毛毛雨'],
  61:['🌧','小雨'], 63:['🌧','中雨'], 65:['🌧','大雨'],
  71:['🌨','小雪'], 73:['❄️','中雪'], 75:['❄️','大雪'],
  80:['🌦','陣雨'], 81:['🌦','陣雨'], 82:['⛈','強陣雨'],
  95:['⛈','雷雨'], 96:['⛈','雷雨'], 99:['⛈','雷雨'],
};
function wmo(code) { return WMO[code] || ['🌡','—']; }

async function loadWeather() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
    );
    const { latitude: lat, longitude: lng } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=auto&forecast_days=2`;
    const data = await (await fetch(url)).json();
    const cur = data.current;
    const [todayMax, todayMin] = [data.daily.temperature_2m_max[0], data.daily.temperature_2m_min[0]];
    const [tmrMax, tmrMin, tmrCode] = [
      data.daily.temperature_2m_max[1], data.daily.temperature_2m_min[1], data.daily.weather_code[1]
    ];
    const [ico, desc] = wmo(cur.weather_code);
    const [tico, tdesc] = wmo(tmrCode);
    document.getElementById('wb-icon').textContent  = ico;
    document.getElementById('wb-temp').textContent  = `${desc} ${Math.round(cur.temperature_2m)}° （${Math.round(todayMin)}–${Math.round(todayMax)}°）`;
    document.getElementById('wb-tomorrow').textContent = `明日 ${tico} ${tdesc} ${Math.round(tmrMin)}–${Math.round(tmrMax)}°`;
    // 反查城市名（使用 Open-Meteo geocoding）
    try {
      const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const gd  = await geo.json();
      const city = gd.address?.city || gd.address?.town || gd.address?.county || '';
      document.getElementById('wb-loc').textContent = city ? `📍 ${city}` : '';
    } catch { /* 反查失敗不影響天氣 */ }
  } catch {
    // 定位失敗 → 預設顯示東京天氣
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=35.6762&longitude=139.6503` +
        `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&timezone=Asia/Tokyo&forecast_days=2`;
      const data = await (await fetch(url)).json();
      const cur = data.current;
      const [ico, desc] = wmo(cur.weather_code);
      const [tico, tdesc] = wmo(data.daily.weather_code[1]);
      document.getElementById('wb-icon').textContent  = ico;
      document.getElementById('wb-temp').textContent  = `${desc} ${Math.round(cur.temperature_2m)}° 東京`;
      document.getElementById('wb-tomorrow').textContent = `明日 ${tico} ${tdesc} ${Math.round(data.daily.temperature_2m_min[1])}–${Math.round(data.daily.temperature_2m_max[1])}°`;
      document.getElementById('wb-loc').textContent = '📍 東京（預設）';
    } catch {
      document.getElementById('wb-temp').textContent = '天氣資訊無法取得';
    }
  }
}

loadWeather();

// ════════════════════════════════════════════
//  PAGE TABS
// ════════════════════════════════════════════
document.querySelectorAll('.page-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${tab.dataset.page}`);
    targetPage.classList.remove('hidden');
    targetPage.classList.add('active');
    if (tab.dataset.page === 'shopping') renderShoppingList();
    if (tab.dataset.page === 'itinerary' && window.MAP) setTimeout(() => window.MAP.invalidateSize(), 50);

  });
});

// ════════════════════════════════════════════
//  MAP
// ════════════════════════════════════════════
const map = L.map('map', { zoomControl: true }).setView([35.6762, 139.6503], 12);
window.MAP = map;
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap', maxZoom: 19,
}).addTo(map);

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function showToast(msg) {
  const el = document.createElement('div');
  el.textContent = msg;
  Object.assign(el.style, {
    position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
    background:'#1A1A1A', color:'#fff', padding:'10px 20px', borderRadius:'24px',
    fontSize:'13px', zIndex:'9999', transition:'opacity .3s', fontWeight:'700',
  });
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 300); }, 2200);
}

function makeIcon(type) {
  const emoji = type==='restaurant' ? '🍽' : type==='hotel' ? '🏨' : '🏯';
  const color = type==='restaurant' ? '#E63B2E' : type==='hotel' ? '#FF9800' : '#2A6FC9';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <ellipse cx="15" cy="35" rx="6" ry="3" fill="rgba(0,0,0,.2)"/>
    <path d="M15 0C8.37 0 3 5.37 3 12c0 8.5 12 26 12 26S27 20.5 27 12C27 5.37 21.63 0 15 0z" fill="${color}"/>
    <text x="15" y="16" text-anchor="middle" font-size="13">${emoji}</text>
  </svg>`;
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">${svg}</div>`,
    iconSize:[30,38], iconAnchor:[15,38], popupAnchor:[0,-38],
  });
}

function googleMapsUrl(place) {
  if (place.lat && place.lng)
    return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.lat},${place.lng},17z`;
  return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;
}

// ════════════════════════════════════════════
//  LOAD PLACES
// ════════════════════════════════════════════
async function loadPlaces() {
  try {
    const res = await fetch('/places.json');
    allPlaces = await res.json();
    filteredPlaces = allPlaces;
    renderPlacesList();
    renderMarkers();
    updateCount();
  } catch (e) { console.error('載入地點失敗', e); }
}

function renderMarkers() {
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};
  filteredPlaces.forEach((place, idx) => {
    const marker = L.marker([place.lat, place.lng], { icon: makeIcon(place.type) })
      .addTo(map)
      .bindPopup(buildPopupHTML(place, idx), { maxWidth: 270 });
    marker.on('click', () => highlightListItem(idx));
    markers[idx] = marker;
  });
  if (filteredPlaces.length > 0) {
    map.fitBounds(L.featureGroup(Object.values(markers)).getBounds().pad(0.1));
  }
}

function buildPopupHTML(place, idx) {
  const typeLabel = place.type==='restaurant' ? '🍽 餐廳' : '🏯 景點';
  const desc = place.description
    ? `<p style="font-size:11px;color:#666;margin:4px 0">${escHtml(place.description)}</p>` : '';
  return `
    <div style="font-family:-apple-system,sans-serif">
      <strong style="font-size:13px">${escHtml(place.name)}</strong>
      <div style="font-size:11px;color:#999;margin:2px 0">${typeLabel}</div>
      ${desc}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <select style="flex:1;padding:4px;font-size:12px;border:1px solid #ddd;border-radius:8px"
          onchange="addToDay(${idx},this.value)">
          <option value="">＋ 加入行程日期…</option>
          ${Object.entries(itinerary).map(([d,day])=>`<option value="${d}">${day.label}</option>`).join('')}
        </select>
        <a href="${googleMapsUrl(place)}" target="_blank" rel="noopener"
          style="padding:4px 8px;font-size:11px;background:#E8F4FD;border:1px solid #90CAF9;border-radius:8px;text-decoration:none;color:#1565C0;font-weight:700">
          🗺 Google Maps
        </a>
        <button style="padding:4px 8px;font-size:11px;background:#F3E5F5;border:1px solid #CE93D8;border-radius:8px;cursor:pointer;color:#7B1FA2;font-weight:700"
          onclick="showNearbyByIdx(${idx})">📍 附近</button>
      </div>
    </div>`;
}

function renderPlacesList() {
  const ul = document.getElementById('places-list');
  ul.innerHTML = '';
  filteredPlaces.forEach((place, idx) => {
    const li = document.createElement('li');
    li.dataset.idx = idx;
    const icon = place.type==='restaurant' ? '🍽' : '🏯';
    li.innerHTML = `
      <span class="place-icon">${icon}</span>
      <div class="place-info">
        <div class="place-name">${escHtml(place.name)}</div>
        ${place.description ? `<div class="place-desc">${escHtml(place.description)}</div>` : ''}
      </div>
      <div class="place-actions">
        <a class="place-map-link" href="${googleMapsUrl(place)}" target="_blank" rel="noopener" title="Google Maps">G</a>
        <button class="place-add-btn" data-idx="${idx}">＋</button>
      </div>`;
    li.addEventListener('click', e => {
      if (e.target.closest('.place-actions')) return;
      flyToPlace(idx);
      showNearbyByIdx(idx);
    });
    li.querySelector('.place-add-btn').addEventListener('click', e => {
      e.stopPropagation();
      showDayPicker(idx);
    });
    ul.appendChild(li);
  });
}

function highlightListItem(idx) {
  document.querySelectorAll('#places-list li').forEach(li => li.classList.remove('highlighted'));
  const target = document.querySelector(`#places-list li[data-idx="${idx}"]`);
  if (target) { target.classList.add('highlighted'); target.scrollIntoView({ block:'nearest' }); }
}

function flyToPlace(idx) {
  const place = filteredPlaces[idx];
  map.flyTo([place.lat, place.lng], 15, { duration:0.8 });
  markers[idx]?.openPopup();
  highlightListItem(idx);
}

function updateCount() {
  document.getElementById('places-count').textContent = `共 ${filteredPlaces.length} 個地點`;
}

function applyFilter() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filteredPlaces = allPlaces.filter(p => {
    const matchType = activeFilter==='all' || p.type===activeFilter;
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q);
    return matchType && matchQ;
  });
  renderPlacesList(); renderMarkers(); updateCount();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type;
    applyFilter();
  });
});
document.getElementById('search-input').addEventListener('input', applyFilter);

// ════════════════════════════════════════════
//  PLACE SEARCH (Nominatim + Google Maps link)
// ════════════════════════════════════════════
const OSM_TYPE_EMOJI = {
  restaurant: '🍽', cafe: '☕', bar: '🍺', fast_food: '🍔',
  attraction: '🏯', temple: '⛩', shrine: '⛩', museum: '🏛',
  park: '🌳', garden: '🌸', theme_park: '🎢',
  hotel: '🏨', hostel: '🏨',
  shop: '🛍', mall: '🛍', supermarket: '🛒',
  station: '🚉', subway: '🚇',
  default: '📍',
};

function osmEmoji(tags) {
  if (!tags) return '📍';
  const t = tags.tourism || tags.amenity || tags.leisure || tags.shop || tags.railway || '';
  return OSM_TYPE_EMOJI[t] || '📍';
}

function osmToType(tags) {
  if (!tags) return 'attraction';
  const a = tags.amenity || '';
  if (['restaurant','cafe','bar','fast_food','food_court'].includes(a)) return 'restaurant';
  return 'attraction';
}

function googleMapsSearchUrl(name, lat, lng) {
  // 用名稱+座標組成搜尋連結，在手機上會開啟 Google Maps app
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&center=${lat},${lng}`;
}

let pspDebounce = null;

document.getElementById('btn-place-search').addEventListener('click', () => {
  document.getElementById('place-search-panel').classList.remove('hidden');
  document.getElementById('psp-input').focus();
});

document.getElementById('psp-close').addEventListener('click', () => {
  document.getElementById('place-search-panel').classList.add('hidden');
  document.getElementById('psp-input').value = '';
  document.getElementById('psp-results').innerHTML = '';
});

document.getElementById('psp-input').addEventListener('input', function() {
  clearTimeout(pspDebounce);
  const q = this.value.trim();
  if (!q) { document.getElementById('psp-results').innerHTML = ''; return; }
  document.getElementById('psp-results').innerHTML = '<div class="psp-loading">搜尋中…</div>';
  pspDebounce = setTimeout(() => searchNominatim(q), 500);
});

async function searchNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1&limit=8&accept-language=zh-TW,ja,en&viewbox=138.0,35.0,141.5,36.8&bounded=0`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'zh-TW,ja,en' } });
    const data = await res.json();
    renderPspResults(data, query);
  } catch (e) {
    document.getElementById('psp-results').innerHTML = '<div class="psp-empty">搜尋失敗，請稍後再試</div>';
  }
}

function renderPspResults(data, query) {
  const el = document.getElementById('psp-results');
  if (!data || data.length === 0) {
    el.innerHTML = `<div class="psp-empty">找不到「${escHtml(query)}」的相關地點</div>`;
    return;
  }
  const dayOptions = Object.entries(DAY_SHORT).map(([d, label]) =>
    `<option value="${d}">${label}</option>`).join('');

  el.innerHTML = data.map((item, idx) => {
    const name = item.namedetails?.name || item.display_name.split(',')[0];
    const addr = item.display_name.split(',').slice(1, 4).join('、').trim();
    const lat  = parseFloat(item.lat);
    const lng  = parseFloat(item.lon);
    const emoji = osmEmoji(item.extratags);
    const gmapUrl = googleMapsSearchUrl(name, lat, lng);
    return `
      <div class="psp-card">
        <div class="psp-card-icon">${emoji}</div>
        <div class="psp-card-body">
          <div class="psp-card-name">${escHtml(name)}</div>
          <div class="psp-card-addr">${escHtml(addr)}</div>
          <div class="psp-card-actions">
            <select class="psp-day-sel" id="psp-day-${idx}">${dayOptions}</select>
            <button class="psp-add-btn" data-idx="${idx}" data-name="${escHtml(name)}" data-lat="${lat}" data-lng="${lng}" data-type="${osmToType(item.extratags)}">＋ 加入行程</button>
            <a class="psp-gmap-btn" href="${gmapUrl}" target="_blank" rel="noopener">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#4285F4"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Google Maps
            </a>
          </div>
        </div>
      </div>`;
  }).join('');
}

document.getElementById('psp-results').addEventListener('click', e => {
  const btn = e.target.closest('.psp-add-btn');
  if (!btn) return;
  const idx  = btn.dataset.idx;
  const date = document.getElementById(`psp-day-${idx}`)?.value;
  if (!date || !itinerary[date]) return;
  const place = {
    name: btn.dataset.name,
    lat: parseFloat(btn.dataset.lat),
    lng: parseFloat(btn.dataset.lng),
    type: btn.dataset.type,
    description: '',
  };
  if (!itinerary[date].places) itinerary[date].places = [];
  if (itinerary[date].places.some(p => p.name === place.name)) {
    showToast('此地點已在行程中'); return;
  }
  itinerary[date].places.push(place);
  const container = document.getElementById(`day-${date}`);
  if (container) renderDayPlaces(container, date);
  drawRouteLines();
  showToast(`✓ 已加入 ${DAY_SHORT[date]}`);
  btn.textContent = '✓ 已加入'; btn.disabled = true;
});

// ════════════════════════════════════════════
//  LOAD ITINERARY
// ════════════════════════════════════════════
async function loadItinerary() {
  // 立刻用靜態檔渲染，不等 sync
  const res = await fetch('/itinerary.json');
  itinerary = await res.json();
  renderItinerary();
  drawRouteLines();
  // 背景從 Gist 拉最新版，有差異再重新渲染
  fetch('/api/sync')
    .then(r => r.json())
    .then(syncData => {
      if (!syncData.itinerary) return;
      const remote = JSON.parse(syncData.itinerary);
      itinerary = remote;
      renderItinerary();
      drawRouteLines();
    })
    .catch(() => {});
}

// ════════════════════════════════════════════
//  RENDER ITINERARY
// ════════════════════════════════════════════
function renderItinerary() {
  const container = document.getElementById('itinerary-days');
  container.innerHTML = '';
  Object.entries(itinerary).forEach(([date, day]) => {
    const col = document.createElement('div');
    col.className = 'day-column';
    col.dataset.date = date;
    col.innerHTML = `
      <div class="day-header">
        <span>${day.label}</span>
        <button class="btn-optimize" onclick="optimizeDay('${date}')">🗺 最佳化</button>
      </div>
      <div class="day-places" id="day-${date}"></div>
      <div class="day-notes-wrap">
        <div class="day-notes-label">📝 備注</div>
        <textarea class="day-notes" data-date="${date}" placeholder="新增當日備注…" rows="2">${escHtml(day.notes||'')}</textarea>
      </div>
      <div class="day-hotel-footer">
        <div class="hotel-card">
          <span class="hotel-icon">🏨</span>
          <span class="hotel-name">${escHtml(HOTEL.name)}</span>
          <a class="hotel-gmaps" href="${googleMapsUrl(HOTEL)}" target="_blank" rel="noopener" title="在 Google Maps 查看">📍</a>
          <span class="hotel-badge">住宿</span>
        </div>
      </div>
      <div class="day-review-wrap">
        <button class="day-review-toggle" data-date="${date}">
          <span>📸 回顧</span>
          <span class="review-toggle-arrow">▼</span>
        </button>
        <div class="day-review-body" id="review-body-${date}" style="display:none">
          <textarea class="day-review-text" data-date="${date}" placeholder="記錄今天的精彩…" rows="3">${escHtml(day.review?.text||'')}</textarea>
          <div class="day-review-photos" id="review-photos-${date}"></div>
          <label class="review-add-photo" title="上傳照片">
            📷 新增照片
            <input type="file" accept="image/*" multiple style="display:none" data-date="${date}">
          </label>
        </div>
      </div>`;
    container.appendChild(col);

    const placesList = col.querySelector('.day-places');
    renderDayPlaces(placesList, date);
    Sortable.create(placesList, {
      group: 'itinerary', animation: 150,
      ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
      onEnd: syncItineraryFromDOM,
    });

    // Notes auto-save
    col.querySelector('.day-notes').addEventListener('blur', () => {
      const txt = col.querySelector(`.day-notes[data-date="${date}"]`).value;
      if (itinerary[date]) itinerary[date].notes = txt;
    });

    // Review toggle
    col.querySelector('.day-review-toggle').addEventListener('click', () => {
      const body  = document.getElementById(`review-body-${date}`);
      const arrow = col.querySelector('.review-toggle-arrow');
      const open  = body.style.display === 'none';
      body.style.display = open ? '' : 'none';
      arrow.classList.toggle('open', open);
      if (open) renderReviewPhotos(date);
    });

    // Review text auto-save
    col.querySelector('.day-review-text').addEventListener('blur', () => {
      const txt = col.querySelector(`.day-review-text[data-date="${date}"]`).value;
      if (!itinerary[date].review) itinerary[date].review = {};
      itinerary[date].review.text = txt;
    });

    // Photo upload
    col.querySelector('input[type="file"]').addEventListener('change', e => handlePhotoUpload(e, date));

    renderReviewPhotos(date);
  });
}

function renderDayPlaces(container, date) {
  container.innerHTML = '';
  const places = itinerary[date]?.places || [];
  if (places.length === 0) {
    container.innerHTML = '<div class="day-empty">從左側拖入地點</div>';
    return;
  }
  places.forEach((place, pIdx) => container.appendChild(makePlaceCard(place, date, pIdx)));
}

function makePlaceCard(place, date, pIdx) {
  const icon = place.type==='restaurant' ? '🍽' : place.type==='hotel' ? '🏨' : '🏯';
  const card = document.createElement('div');
  card.className = 'itinerary-place';
  card.dataset.name = place.name;
  card.dataset.lat  = place.lat;
  card.dataset.lng  = place.lng;
  card.dataset.type = place.type;
  card.dataset.description = place.description || '';
  card.innerHTML = `
    <span class="iplace-icon">${icon}</span>
    <div class="iplace-info">
      <div class="iplace-name">${escHtml(place.name)}</div>
      ${place.description ? `<div class="iplace-desc">${escHtml(place.description)}</div>` : ''}
    </div>
    <div class="iplace-actions">
      <a class="iplace-gmaps" href="${googleMapsUrl(place)}" target="_blank" rel="noopener" title="Google Maps" onclick="event.stopPropagation()">📍</a>
      <button class="iplace-remove" title="移除" data-date="${date}" data-idx="${pIdx}">×</button>
    </div>`;
  card.querySelector('.iplace-remove').addEventListener('click', e => {
    e.stopPropagation();
    removeFromDay(date, pIdx);
  });
  card.addEventListener('click', () => {
    if (place.lat && place.lng) map.flyTo([place.lat, place.lng], 15, { duration:0.8 });
  });
  return card;
}

function syncItineraryFromDOM() {
  Object.keys(itinerary).forEach(date => {
    const container = document.getElementById(`day-${date}`);
    if (!container) return;
    const cards = container.querySelectorAll('.itinerary-place');
    itinerary[date].places = Array.from(cards).map(card => ({
      name: card.dataset.name,
      lat: parseFloat(card.dataset.lat) || 0,
      lng: parseFloat(card.dataset.lng) || 0,
      type: card.dataset.type,
      description: card.dataset.description,
    }));
    if (cards.length === 0) container.innerHTML = '<div class="day-empty">從左側拖入地點</div>';
  });
  drawRouteLines();
  if (timelineMode) renderTimelineView();
}

// ════════════════════════════════════════════
//  REVIEW PHOTOS (localStorage)
// ════════════════════════════════════════════
function getReviewPhotos(date) {
  return JSON.parse(localStorage.getItem(`review_photos_${date}`) || '[]');
}
function saveReviewPhotos(date, photos) {
  localStorage.setItem(`review_photos_${date}`, JSON.stringify(photos));
}
function renderReviewPhotos(date) {
  const wrap = document.getElementById(`review-photos-${date}`);
  if (!wrap) return;
  const photos = getReviewPhotos(date);
  wrap.innerHTML = '';
  photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src; img.className = 'review-photo-thumb';
    img.title = '點擊刪除';
    img.addEventListener('click', () => {
      if (confirm('刪除這張照片？')) {
        const updated = getReviewPhotos(date);
        updated.splice(i, 1);
        saveReviewPhotos(date, updated);
        renderReviewPhotos(date);
      }
    });
    wrap.appendChild(img);
  });
}
function handlePhotoUpload(e, date) {
  const files = Array.from(e.target.files);
  const photos = getReviewPhotos(date);
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      photos.push(ev.target.result);
      loaded++;
      if (loaded === files.length) {
        saveReviewPhotos(date, photos);
        renderReviewPhotos(date);
        showToast(`已加入 ${files.length} 張照片 ✓`);
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

// ════════════════════════════════════════════
//  DAY OPERATIONS
// ════════════════════════════════════════════
function addToDay(placeIdx, date) {
  if (!date) return;
  const place = filteredPlaces[placeIdx];
  if (!place) return;
  if (itinerary[date].places.some(p => p.name === place.name)) {
    alert(`「${place.name}」已在 ${itinerary[date].label} 中`);
    return;
  }
  itinerary[date].places.push({ ...place });
  const container = document.getElementById(`day-${date}`);
  if (container) {
    container.querySelector('.day-empty')?.remove();
    container.appendChild(makePlaceCard(place, date, itinerary[date].places.length - 1));
  }
  map.closePopup();
}

function showDayPicker(idx) {
  const place = filteredPlaces[idx];
  const dateKeys = Object.keys(itinerary);
  const options = dateKeys.map((d,i) => `${i+1}. ${itinerary[d].label}`).join('\n');
  const choice = prompt(`將「${place.name}」加入哪一天？\n\n${options}\n\n請輸入數字：`);
  const n = parseInt(choice);
  if (isNaN(n) || n<1 || n>dateKeys.length) return;
  addToDay(idx, dateKeys[n-1]);
}

function removeFromDay(date, pIdx) {
  itinerary[date].places.splice(pIdx, 1);
  const container = document.getElementById(`day-${date}`);
  if (container) renderDayPlaces(container, date);
}

// ════════════════════════════════════════════
//  ROUTE OPTIMIZATION
// ════════════════════════════════════════════
function nearestNeighbor(start, places) {
  const remaining = places.filter(p => p.lat && p.lng);
  const noCoords  = places.filter(p => !p.lat || !p.lng);
  const result = [];
  let current = start;
  while (remaining.length > 0) {
    let minDist = Infinity, minIdx = 0;
    remaining.forEach((p,i) => {
      const d = haversine(current.lat, current.lng, p.lat, p.lng);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    result.push(remaining[minIdx]);
    current = remaining[minIdx];
    remaining.splice(minIdx, 1);
  }
  return [...result, ...noCoords];
}

function optimizeDay(date) {
  const places = itinerary[date]?.places || [];
  if (places.length < 2) { showToast('至少需要 2 個地點才能最佳化'); return; }
  itinerary[date].places = nearestNeighbor(HOTEL, places);
  const container = document.getElementById(`day-${date}`);
  if (container) renderDayPlaces(container, date);
  showToast(`${itinerary[date].label} 路線已最佳化 ✓`);
}

// ════════════════════════════════════════════
//  NEARBY PLACES
// ════════════════════════════════════════════
function showNearbyByIdx(idx) {
  const place = filteredPlaces[idx];
  if (!place?.lat || !place?.lng) return;
  showNearby(place);
}

function showNearby(centerPlace) {
  const nearby = allPlaces
    .filter(p => p.name !== centerPlace.name && p.lat && p.lng)
    .map(p => ({ ...p, dist: haversine(centerPlace.lat, centerPlace.lng, p.lat, p.lng) }))
    .filter(p => p.dist <= NEARBY_RADIUS_KM)
    .sort((a,b) => a.dist - b.dist).slice(0, 15);

  const panel = document.getElementById('nearby-panel');
  const title = document.getElementById('nearby-title');
  const list  = document.getElementById('nearby-list');
  title.textContent = `「${centerPlace.name}」附近 ${NEARBY_RADIUS_KM}km（${nearby.length} 個）`;
  list.innerHTML = '';
  if (nearby.length === 0) {
    list.innerHTML = '<li style="padding:12px;color:#999;font-size:12px">附近無收藏地點</li>';
  } else {
    nearby.forEach(p => {
      const li = document.createElement('li');
      const icon = p.type==='restaurant' ? '🍽' : '🏯';
      const distStr = p.dist < 0.1 ? `${Math.round(p.dist*1000)}m` : `${p.dist.toFixed(2)}km`;
      li.innerHTML = `<span>${icon}</span><span style="flex:1">${escHtml(p.name)}</span><span class="nearby-dist">${distStr}</span>`;
      li.addEventListener('click', () => {
        map.flyTo([p.lat, p.lng], 16, { duration:0.8 });
        const pidx = filteredPlaces.findIndex(fp => fp.name === p.name);
        if (pidx !== -1) { markers[pidx]?.openPopup(); highlightListItem(pidx); }
      });
      list.appendChild(li);
    });
  }
  panel.classList.remove('hidden');
}

document.getElementById('close-nearby').addEventListener('click', () => {
  document.getElementById('nearby-panel').classList.add('hidden');
});

// ════════════════════════════════════════════
//  SAVE ITINERARY
// ════════════════════════════════════════════
async function saveItinerary() {
  syncItineraryFromDOM();
  // 收集 notes 與 review.text
  Object.keys(itinerary).forEach(date => {
    const notesEl = document.querySelector(`.day-notes[data-date="${date}"]`);
    if (notesEl) itinerary[date].notes = notesEl.value;
    const revEl = document.querySelector(`.day-review-text[data-date="${date}"]`);
    if (revEl) {
      if (!itinerary[date].review) itinerary[date].review = {};
      itinerary[date].review.text = revEl.value;
    }
  });
  try {
    await fetch('/api/sync', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ itinerary: JSON.stringify(itinerary) }),
    });
    showToast('行程已儲存 ✓');
  } catch (e) { alert('儲存失敗：' + e.message); }
}

// ════════════════════════════════════════════
//  FEATURE 1: ROUTE CONNECTIONS ON MAP
// ════════════════════════════════════════════
const DAY_COLORS = {
  '2026-08-03': '#E74C3C',
  '2026-08-04': '#E67E22',
  '2026-08-05': '#27AE60',
  '2026-08-06': '#2980B9',
  '2026-08-07': '#8E44AD',
  '2026-08-08': '#16A085',
};
let routePolylines = {};
let routeNumMarkers = {};
let routeLinesVisible = true;

function drawRouteLines() {
  Object.values(routePolylines).forEach(p => map.removeLayer(p));
  Object.values(routeNumMarkers).flat().forEach(m => map.removeLayer(m));
  routePolylines = {};
  routeNumMarkers = {};
  if (!routeLinesVisible) return;

  Object.entries(itinerary).forEach(([date, day]) => {
    const places = (day.places || []).filter(p => p.lat && p.lng);
    if (!places.length) return;
    const color = DAY_COLORS[date] || '#888';

    if (places.length >= 2) {
      routePolylines[date] = L.polyline(places.map(p => [p.lat, p.lng]), {
        color, weight: 3, opacity: 0.6, dashArray: '8 5',
      }).addTo(map);
    }
    routeNumMarkers[date] = places.map((p, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i+1}</div>`,
        iconSize:[22,22], iconAnchor:[11,11],
      });
      return L.marker([p.lat, p.lng], { icon, zIndexOffset: 500 }).addTo(map);
    });
  });
}

document.getElementById('btn-route-lines').addEventListener('click', function() {
  routeLinesVisible = !routeLinesVisible;
  this.classList.toggle('active', routeLinesVisible);
  drawRouteLines();
});

// ════════════════════════════════════════════
//  FEATURE 2: TIMELINE VIEW
// ════════════════════════════════════════════
let timelineMode = false;

function renderTimelineView() {
  const container = document.getElementById('timeline-view');
  container.innerHTML = Object.entries(itinerary).map(([date, day]) => {
    const places = day.places || [];
    const color  = DAY_COLORS[date] || '#888';
    const placesHtml = places.length ? places.map((p, i) => {
      const isLast = i === places.length - 1;
      const emoji = p.type === 'restaurant' ? '🍽' : p.type === 'hotel' ? '🏨' : '🏯';
      return `
        <div class="tl-item${isLast ? ' tl-last' : ''}">
          <div class="tl-left">
            <div class="tl-dot" style="background:${color};border-color:${color}"><span style="color:#fff;font-size:9px;font-weight:800">${i+1}</span></div>
            <div class="tl-line" style="background:${color}"></div>
          </div>
          <div class="tl-content">
            <div class="tl-place-name">${emoji} ${escHtml(p.name)}</div>
            ${p.description ? `<div class="tl-place-desc">${escHtml(p.description)}</div>` : ''}
          </div>
        </div>`;
    }).join('') : '<div class="tl-empty">尚無行程安排</div>';

    return `
      <div class="tl-day">
        <div class="tl-day-header" style="border-left:4px solid ${color}">
          <span class="tl-day-label" style="color:${color}">${escHtml(day.label)}</span>
          <span class="tl-day-count">${places.length} 個地點</span>
        </div>
        <div class="tl-places">${placesHtml}</div>
        <div class="tl-hotel">🏨 ${escHtml(HOTEL.name)}</div>
      </div>`;
  }).join('');
}

document.getElementById('btn-view-toggle').addEventListener('click', function() {
  timelineMode = !timelineMode;
  this.textContent = timelineMode ? '📋 天數欄' : '🗓 時間軸';
  document.getElementById('itinerary-days').classList.toggle('hidden', timelineMode);
  const tl = document.getElementById('timeline-view');
  if (timelineMode) { renderTimelineView(); tl.classList.remove('hidden'); }
  else { tl.classList.add('hidden'); }
});

// ════════════════════════════════════════════
//  FEATURE 3: GAMIFICATION
// ════════════════════════════════════════════
function updateCountdown() {
  const depart = new Date('2026-08-03T00:00:00');
  const now    = new Date();
  const days   = Math.ceil((depart - now) / 86400000);
  const pill   = document.getElementById('countdown-pill');
  if (!pill) return;
  if (days > 0) {
    pill.textContent = `✈ ${days} 天後出發`;
    pill.style.background = days <= 30 ? '#FFEAA7' : '#E8F5E9';
    pill.style.color       = days <= 30 ? '#CC8800' : '#27AE60';
  } else if (days === 0) {
    pill.textContent = '🎉 今天出發！';
    pill.style.background = '#FFE0E0'; pill.style.color = '#E74C3C';
  } else {
    pill.textContent = `📸 旅行中 Day ${-days + 1}`;
    pill.style.background = '#E8F0FE'; pill.style.color = '#2980B9';
  }
}

function updatePrepProgress() {
  const all     = document.querySelectorAll('#page-preparation .prep-item input[type=checkbox]');
  const checked = document.querySelectorAll('#page-preparation .prep-item input[type=checkbox]:checked');
  const pct = all.length ? Math.round(checked.length / all.length * 100) : 0;
  const bar = document.getElementById('prep-progress-bar');
  const txt = document.getElementById('prep-progress-pct');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = pct + '%';
  if (bar) bar.style.background = pct === 100 ? '#27AE60' : pct >= 60 ? '#F39C12' : '#E74C3C';
  if (pct === 100 && !sessionStorage.getItem('prep_complete_toast')) {
    showToast('🎉 行前準備 100% 完成！');
    sessionStorage.setItem('prep_complete_toast', '1');
  }
}

document.getElementById('page-preparation').addEventListener('change', updatePrepProgress);

// ════════════════════════════════════════════
//  FEATURE 4: AI ITINERARY SUGGESTIONS
// ════════════════════════════════════════════
const AI_PRESETS = {
  culture: [
    { name:'淺草寺', type:'attraction', lat:35.7147, lng:139.7966, description:'雷門・仲見世通・人力車' },
    { name:'上野公園', type:'attraction', lat:35.7143, lng:139.7731, description:'博物館・動物園・藝術館群' },
    { name:'明治神宮', type:'attraction', lat:35.6763, lng:139.6993, description:'都心中的森林神社' },
    { name:'東京晴空塔', type:'attraction', lat:35.7101, lng:139.8107, description:'登高俯瞰東京全景' },
    { name:'根津神社', type:'attraction', lat:35.7203, lng:139.7619, description:'千本鳥居、季節花卉' },
  ],
  food: [
    { name:'築地場外市場', type:'restaurant', lat:35.6655, lng:139.7705, description:'海鮮丼・壽司・炸物' },
    { name:'上野阿美橫町', type:'attraction', lat:35.7073, lng:139.7750, description:'小吃攤位・零食採買' },
    { name:'月島もんじゃ街', type:'restaurant', lat:35.6571, lng:139.7840, description:'文字燒發源地' },
    { name:'門前仲町', type:'restaurant', lat:35.6715, lng:139.7978, description:'老街居酒屋・深川飯' },
    { name:'中目黑',type:'restaurant', lat:35.6438, lng:139.6992, description:'目黑川沿岸咖啡廳' },
  ],
  shopping: [
    { name:'原宿竹下通', type:'attraction', lat:35.6692, lng:139.7044, description:'潮流服飾・裏原宿' },
    { name:'澀谷 109', type:'attraction', lat:35.6585, lng:139.6994, description:'女裝時尚百貨' },
    { name:'秋葉原電器街', type:'attraction', lat:35.7023, lng:139.7745, description:'電器・動漫・模型' },
    { name:'銀座三越', type:'attraction', lat:35.6715, lng:139.7631, description:'精品百貨・免稅購物' },
    { name:'吉祥寺', type:'attraction', lat:35.7027, lng:139.5797, description:'復古雜貨・特色小店' },
  ],
  relax: [
    { name:'代代木公園', type:'attraction', lat:35.6732, lng:139.6947, description:'遛狗・野餐・放鬆' },
    { name:'谷中銀座商店街', type:'attraction', lat:35.7272, lng:139.7671, description:'昭和老街風情散步' },
    { name:'清澄白河', type:'attraction', lat:35.6792, lng:139.8009, description:'下町咖啡文化聖地' },
    { name:'自由之丘', type:'attraction', lat:35.6077, lng:139.6685, description:'歐風街道・甜點・散步' },
    { name:'代官山蔦屋書店', type:'attraction', lat:35.6488, lng:139.7026, description:'設計感書店・選物店' },
  ],
  mix: [
    { name:'淺草寺', type:'attraction', lat:35.7147, lng:139.7966, description:'雷門・仲見世通' },
    { name:'上野阿美橫町', type:'restaurant', lat:35.7073, lng:139.7750, description:'午餐採買' },
    { name:'秋葉原電器街', type:'attraction', lat:35.7023, lng:139.7745, description:'電器・動漫' },
    { name:'東京晴空塔', type:'attraction', lat:35.7101, lng:139.8107, description:'夜景展望' },
    { name:'押上商店街', type:'restaurant', lat:35.7100, lng:139.8119, description:'晚餐・在地氛圍' },
  ],
};

document.getElementById('btn-ai-suggest').addEventListener('click', () => {
  const panel = document.getElementById('ai-panel');
  panel.classList.toggle('hidden');
  // 自動選取目前可見的第一個天欄
  if (!panel.classList.contains('hidden')) {
    const firstVisibleDay = document.querySelector('.day-column')?.dataset?.date;
    const sel = document.getElementById('ai-date-sel');
    if (sel && firstVisibleDay) sel.value = firstVisibleDay;
  }
});
document.getElementById('ai-close').addEventListener('click', () => {
  document.getElementById('ai-panel').classList.add('hidden');
});
function getAISuggestions(date, style) {
  // 優先從 itinerary 物件取，若尚未載入則從 DOM 讀取
  let dayPlaces = itinerary[date]?.places || [];
  if (dayPlaces.length === 0) {
    const container = document.getElementById(`day-${date}`);
    if (container) {
      dayPlaces = Array.from(container.querySelectorAll('.itinerary-place')).map(el => ({
        name: el.dataset.name,
        lat: parseFloat(el.dataset.lat) || 0,
        lng: parseFloat(el.dataset.lng) || 0,
      })).filter(p => p.lat && p.lng);
    }
  }

  const allPresets = Object.values(AI_PRESETS).flat();
  const existing = new Set(dayPlaces.map(p => p.name));
  let pool = allPresets.filter(p => !existing.has(p.name));

  if (dayPlaces.length > 0) {
    const centerLat = dayPlaces.reduce((s, p) => s + p.lat, 0) / dayPlaces.length;
    const centerLng = dayPlaces.reduce((s, p) => s + p.lng, 0) / dayPlaces.length;
    pool = pool.map(p => ({
      ...p,
      dist: Math.hypot((p.lat - centerLat) * 111, (p.lng - centerLng) * 91),
    })).sort((a, b) => a.dist - b.dist);
    const sameStyle = (AI_PRESETS[style] || []).filter(p => !existing.has(p.name));
    const nearby = pool.filter(p => p.dist < 15);
    const merged = [...new Map([...sameStyle, ...nearby].map(p => [p.name, p])).values()];
    return merged.slice(0, 5);
  }
  return (AI_PRESETS[style] || AI_PRESETS.mix).filter(p => !existing.has(p.name)).slice(0, 5);
}

document.getElementById('ai-generate-btn').addEventListener('click', () => {
  const date  = document.getElementById('ai-date-sel').value;
  const style = document.getElementById('ai-style-sel').value;
  const suggestions = getAISuggestions(date, style);
  const dayPlaces = itinerary[date]?.places || [];
  const hasContext = dayPlaces.length > 0;
  const resultEl = document.getElementById('ai-result');
  resultEl.innerHTML = `
    <div class="ai-result-title">
      ${hasContext ? `📍 基於 ${DAY_SHORT[date]} 現有行程附近推薦：` : `建議加入 ${DAY_SHORT[date] || date} 的地點：`}
    </div>
    ${suggestions.length === 0 ? '<div style="padding:12px;color:var(--text-muted)">此風格地點已全部加入行程</div>' :
    suggestions.map((p, i) => `
      <div class="ai-suggestion-item">
        <div class="ai-sugg-info">
          <span class="ai-sugg-num">${i+1}</span>
          <div>
            <div class="ai-sugg-name">${escHtml(p.name)}</div>
            <div class="ai-sugg-desc">${escHtml(p.description)}${p.dist !== undefined ? ` · 距${Math.round(p.dist)}km` : ''}</div>
          </div>
        </div>
        <button class="ai-add-btn" data-date="${date}" data-name="${escHtml(p.name)}" data-lat="${p.lat}" data-lng="${p.lng}" data-type="${p.type}" data-desc="${escHtml(p.description)}">＋ 加入</button>
      </div>`).join('')}`;
});

document.getElementById('ai-result').addEventListener('click', e => {
  const btn = e.target.closest('.ai-add-btn');
  if (!btn) return;
  const date  = btn.dataset.date;
  const place = {
    name: btn.dataset.name,
    lat: parseFloat(btn.dataset.lat),
    lng: parseFloat(btn.dataset.lng),
    type: btn.dataset.type,
    description: btn.dataset.desc,
  };
  if (!place.name || !itinerary[date]) return;
  if (!itinerary[date].places) itinerary[date].places = [];
  if (itinerary[date].places.some(p => p.name === place.name)) {
    showToast('此地點已在行程中'); return;
  }
  itinerary[date].places.push(place);
  const container = document.getElementById(`day-${date}`);
  if (container) renderDayPlaces(container, date);
  drawRouteLines();
  if (timelineMode) renderTimelineView();
  btn.textContent = '✓ 已加入'; btn.disabled = true;
  showToast(`${place.name} 已加入 ${DAY_SHORT[date]}`);
});

document.getElementById('btn-save').addEventListener('click', saveItinerary);
document.getElementById('btn-export').addEventListener('click', async () => {
  syncItineraryFromDOM();
  await saveItinerary();
  showToast('行程已儲存至雲端 ✓');
});
document.getElementById('btn-populate').addEventListener('click', async () => {
  showToast('Notion 功能在雲端版暫不支援');
});

// ════════════════════════════════════════════
//  PANEL RESIZE — horizontal (map ↔ itinerary)
// ════════════════════════════════════════════
(function initPanelResize() {
  const resizer    = document.getElementById('panel-resizer');
  const mapPanel   = document.getElementById('map-panel');
  let dragging     = false;

  resizer.addEventListener('mousedown', e => {
    dragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const rect = document.getElementById('page-itinerary').getBoundingClientRect();
    const newW = Math.max(200, Math.min(700, e.clientX - rect.left));
    mapPanel.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setTimeout(() => map.invalidateSize(), 50);
  });
})();

// ════════════════════════════════════════════
//  PLACES LIST RESIZE — vertical (map ↔ list)
// ════════════════════════════════════════════
(function initPlacesResize() {
  const resizer   = document.getElementById('places-resizer');
  const mapEl     = document.getElementById('map');
  const listPanel = document.getElementById('places-list-panel');
  let dragging    = false;

  resizer.addEventListener('mousedown', e => {
    dragging = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const panelRect = document.getElementById('map-panel').getBoundingClientRect();
    const controlsH = document.getElementById('map-controls').offsetHeight;
    const mapH = Math.max(120, e.clientY - panelRect.top - controlsH);
    mapEl.style.height = mapH + 'px';
    mapEl.style.flex = 'none';
    const remaining = panelRect.height - controlsH - mapH - resizer.offsetHeight;
    listPanel.style.height = Math.max(60, remaining) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setTimeout(() => map.invalidateSize(), 50);
  });
})();

// ════════════════════════════════════════════
//  NOTION MODAL
// ════════════════════════════════════════════
async function loadNotion() { notionPages = []; }

// ════════════════════════════════════════════
//  EXPENSE TRACKER
// ════════════════════════════════════════════
function getMemberName(side) {
  const el = document.getElementById(`member-${side}`);
  return (el && el.value.trim()) || (side==='a' ? 'Jim' : '野珊');
}
function syncPaidByOptions() {
  const sel = document.getElementById('exp-paidby');
  if (sel) { sel.options[0].text = getMemberName('a')+' 付'; sel.options[1].text = getMemberName('b')+' 付'; }
}
async function loadExpenses() {
  try { expenses = await (await fetch('/api/expenses')).json(); } catch { expenses = []; }
}
async function saveExpenses() {
  try {
    await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(expenses) });
  } catch (e) { console.error('記帳儲存失敗', e); }
}
function renderExpenseList() {
  const area = document.getElementById('expense-list-area');
  if (!area) return;
  if (expenses.length === 0) {
    area.innerHTML = '<div class="exp-empty">尚無記帳資料<br><small>從下方表單新增支出</small></div>';
    return;
  }
  const byDate = {};
  expenses.forEach((exp,idx) => {
    if (!byDate[exp.date]) byDate[exp.date] = [];
    byDate[exp.date].push({ ...exp, _idx:idx });
  });
  area.innerHTML = '';
  const nameA = getMemberName('a'), nameB = getMemberName('b');
  Object.keys(byDate).sort().forEach(date => {
    const items = byDate[date];
    const dayTotal = items.reduce((s,e) => s+e.amount, 0);
    const group = document.createElement('div');
    group.className = 'exp-day-group';
    group.innerHTML = `
      <div class="exp-day-label"><span>${DAY_SHORT[date]||date}</span><span class="exp-day-total">¥${dayTotal.toLocaleString()}</span></div>
      ${items.map(exp => `
        <div class="exp-item">
          <span class="exp-cat-icon">${CAT_EMOJI[exp.cat]||'📦'}</span>
          <div class="exp-info"><div class="exp-desc">${escHtml(exp.desc||'—')}</div><div class="exp-meta">${CAT_LABEL[exp.cat]||'其他'}</div></div>
          <span class="exp-amount-cell">¥${exp.amount.toLocaleString()}</span>
          <span class="exp-paid-badge ${exp.paidBy==='a'?'badge-a':'badge-b'}">${exp.paidBy==='a'?escHtml(nameA):escHtml(nameB)}</span>
          <button class="exp-del-btn" data-idx="${exp._idx}">×</button>
        </div>`).join('')}`;
    group.querySelectorAll('.exp-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        expenses.splice(parseInt(btn.dataset.idx), 1);
        saveExpenses(); renderExpenseList(); renderSettle();
      });
    });
    area.appendChild(group);
  });
}
function renderSettle() {
  const content = document.getElementById('settle-content');
  if (!content) return;
  const nameA = getMemberName('a'), nameB = getMemberName('b');
  const totalA = expenses.filter(e=>e.paidBy==='a').reduce((s,e)=>s+e.amount,0);
  const totalB = expenses.filter(e=>e.paidBy==='b').reduce((s,e)=>s+e.amount,0);
  const total = totalA+totalB, each = total/2, diff = totalA-each, diffAbs = Math.abs(Math.round(diff));
  const byCat = {};
  expenses.forEach(e => { byCat[e.cat] = (byCat[e.cat]||0) + e.amount; });
  let resultHTML = total===0
    ? `<div class="settle-result" style="border-color:#ccc;background:#f5f5f5"><div class="settle-result-desc" style="font-size:15px">尚無記帳資料</div></div>`
    : diff===0
      ? `<div class="settle-result"><div class="settle-result-label">結算結果</div><div class="settle-result-desc" style="font-size:16px">✅ 兩人花費相同，無需轉帳</div></div>`
      : `<div class="settle-result"><div class="settle-result-label">結算結果</div><div class="settle-result-amount">¥${diffAbs.toLocaleString()}</div><div class="settle-result-desc">${escHtml(diff>0?nameB:nameA)} 應付 ${escHtml(diff>0?nameA:nameB)}<br>¥${diffAbs.toLocaleString()}</div></div>`;
  content.innerHTML = `
    <div class="settle-cards">
      <div class="settle-card settle-card-a"><div class="settle-card-name">${escHtml(nameA)} 已付</div><div class="settle-card-amount">¥${totalA.toLocaleString()}</div><div class="settle-card-sub">應付 ¥${Math.round(each).toLocaleString()}</div></div>
      <div class="settle-card settle-card-b"><div class="settle-card-name">${escHtml(nameB)} 已付</div><div class="settle-card-amount">¥${totalB.toLocaleString()}</div><div class="settle-card-sub">應付 ¥${Math.round(each).toLocaleString()}</div></div>
    </div>
    ${resultHTML}
    <div class="settle-section-title">類別明細</div>
    <table class="settle-cat-table">
      <thead><tr><th>類別</th><th>金額</th><th>佔比</th></tr></thead>
      <tbody>
        ${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>`<tr><td>${CAT_EMOJI[cat]||'📦'} ${CAT_LABEL[cat]||cat}</td><td>¥${amt.toLocaleString()}</td><td>${total>0?Math.round(amt/total*100):0}%</td></tr>`).join('')}
        ${total>0?`<tr style="font-weight:800;border-top:2px solid var(--border)"><td>總計</td><td>¥${total.toLocaleString()}</td><td>100%</td></tr>`:''}
      </tbody>
    </table>`;
}
function addExpense() {
  const date=document.getElementById('exp-date').value, cat=document.getElementById('exp-cat').value;
  const desc=document.getElementById('exp-desc').value.trim(), amount=parseInt(document.getElementById('exp-amount').value,10);
  const paidBy=document.getElementById('exp-paidby').value;
  if (!desc) { showToast('請輸入說明'); return; }
  if (!amount||amount<=0) { showToast('請輸入有效金額'); return; }
  expenses.push({ id:Date.now(), date, cat, desc, amount, paidBy });
  saveExpenses(); renderExpenseList();
  document.getElementById('exp-desc').value=''; document.getElementById('exp-amount').value='';
  showToast('已加入記帳 ✓');
}
function openExpenseModal() {
  document.getElementById('expense-modal').classList.remove('hidden');
  syncPaidByOptions(); renderExpenseList(); renderSettle();
}
document.getElementById('btn-expense').addEventListener('click', openExpenseModal);
document.getElementById('close-expense').addEventListener('click', () => document.getElementById('expense-modal').classList.add('hidden'));
document.getElementById('expense-backdrop').addEventListener('click', () => document.getElementById('expense-modal').classList.add('hidden'));
document.getElementById('btn-add-exp').addEventListener('click', addExpense);
document.getElementById('exp-amount').addEventListener('keydown', e => { if(e.key==='Enter') addExpense(); });
document.querySelectorAll('.exp-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.exp-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.exp-tab-pane').forEach(p=>p.classList.add('hidden'));
    document.getElementById(`exp-tab-${tab.dataset.tab}`).classList.remove('hidden');
    if (tab.dataset.tab==='settle') renderSettle();
  });
});
['member-a','member-b'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { syncPaidByOptions(); renderExpenseList(); });
});
document.getElementById('btn-export-settle').addEventListener('click', () => {
  const nameA=getMemberName('a'), nameB=getMemberName('b');
  const totalA=expenses.filter(e=>e.paidBy==='a').reduce((s,e)=>s+e.amount,0);
  const totalB=expenses.filter(e=>e.paidBy==='b').reduce((s,e)=>s+e.amount,0);
  const total=totalA+totalB, each=Math.round(total/2), diff=totalA-total/2, diffAbs=Math.abs(Math.round(diff));
  let md=`# 東京行程 2026 旅費結算\n\n`;
  md+=`| 成員 | 已付 | 應付 | 差額 |\n|------|------|------|------|\n`;
  md+=`| ${nameA} | ¥${totalA.toLocaleString()} | ¥${each.toLocaleString()} | ${diff>=0?'+':''}¥${Math.round(diff).toLocaleString()} |\n`;
  md+=`| ${nameB} | ¥${totalB.toLocaleString()} | ¥${each.toLocaleString()} | ${-diff>=0?'+':''}¥${Math.round(-diff).toLocaleString()} |\n\n`;
  if (diff>0) md+=`> **${nameB} 應付 ${nameA} ¥${diffAbs.toLocaleString()}**\n\n`;
  else if (diff<0) md+=`> **${nameA} 應付 ${nameB} ¥${diffAbs.toLocaleString()}**\n\n`;
  else md+=`> **兩人花費相同，無需轉帳** ✅\n\n`;
  md+=`## 消費明細\n\n`;
  const byDate={};
  expenses.forEach(e => { if(!byDate[e.date]) byDate[e.date]=[]; byDate[e.date].push(e); });
  Object.keys(byDate).sort().forEach(date => {
    md+=`### ${DAY_SHORT[date]||date}\n`;
    byDate[date].forEach(e => { md+=`- ${CAT_EMOJI[e.cat]||'📦'} ${e.desc} — ¥${e.amount.toLocaleString()}（${e.paidBy==='a'?nameA:nameB} 付）\n`; });
    md+='\n';
  });
  const blob=new Blob([md],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='東京旅費結算.md'; a.click();
  URL.revokeObjectURL(url); showToast('結算已下載 ✓');
});

// ════════════════════════════════════════════
//  行前準備 CHECKLIST (localStorage)
// ════════════════════════════════════════════
function initPrepChecklists() {
  document.querySelectorAll('.prep-item input[type="checkbox"]').forEach(cb => {
    const key = cb.dataset.key;
    cb.checked = localStorage.getItem(`prep_${key}`) === '1';
    cb.closest('.prep-item').classList.toggle('checked', cb.checked);
    cb.addEventListener('change', () => {
      localStorage.setItem(`prep_${key}`, cb.checked ? '1' : '0');
      cb.closest('.prep-item').classList.toggle('checked', cb.checked);
    });
  });

  document.querySelectorAll('.btn-add-prep').forEach(btn => {
    btn.addEventListener('click', () => {
      const listId = btn.dataset.list + '-list';
      const name = prompt('新增項目：');
      if (!name?.trim()) return;
      const key = btn.dataset.list + '_' + Date.now();
      const label = document.createElement('label');
      label.className = 'prep-item';
      label.innerHTML = `<input type="checkbox" data-key="${key}"> ${escHtml(name.trim())}`;
      label.querySelector('input').addEventListener('change', e => {
        localStorage.setItem(`prep_${key}`, e.target.checked ? '1' : '0');
        label.classList.toggle('checked', e.target.checked);
      });
      document.getElementById(listId).appendChild(label);
    });
  });
}

// ════════════════════════════════════════════
//  購物清單 (localStorage)
// ════════════════════════════════════════════
function defaultShopItems() {
  return [
    { id:1, cat:'medicine', name:'DHC 護脣膏', bought:false },
    { id:2, cat:'medicine', name:'曼秀雷敦（薄荷）', bought:false },
    { id:3, cat:'medicine', name:'久光撒隆巴斯', bought:false },
    { id:4, cat:'medicine', name:'樂敦白兔眼藥水', bought:false },
    { id:5, cat:'medicine', name:'石澤研究所毛孔抑制劑', bought:false },
    { id:6, cat:'food', name:'東京香蕉', bought:false },
    { id:7, cat:'food', name:'白色戀人（北海道）', bought:false },
    { id:8, cat:'food', name:'抹茶 KitKat', bought:false },
    { id:9, cat:'food', name:'富士山造型明信片', bought:false },
    { id:10, cat:'fashion', name:'Uniqlo Urban Outdoor 服飾', bought:false },
    { id:11, cat:'fashion', name:'Montbell 防風外套（野珊）', bought:false },
    { id:12, cat:'souvenir', name:'御守（明治神宮）', bought:false },
    { id:13, cat:'souvenir', name:'史努比博物館限定商品', bought:false },
    { id:14, cat:'souvenir', name:'3COINS 生活雜貨', bought:false },
    { id:15, cat:'other', name:'即可拍底片（補充）', bought:false },
  ];
}

function saveShopItems() {
  localStorage.setItem('shopItems', JSON.stringify(shopItems));
}

function renderShoppingList() {
  const container = document.getElementById('shop-categories');
  container.innerHTML = '';
  const total  = shopItems.length;
  const bought = shopItems.filter(i=>i.bought).length;
  document.getElementById('shop-stats').textContent = `已購 ${bought}/${total}`;

  const byCat = {};
  shopItems.forEach(item => {
    if (!byCat[item.cat]) byCat[item.cat] = [];
    byCat[item.cat].push(item);
  });

  Object.entries(SHOP_CAT).forEach(([cat, catLabel]) => {
    const items = byCat[cat] || [];
    if (items.length === 0) return;
    const block = document.createElement('div');
    block.className = 'shop-cat-block';
    const boughtCount = items.filter(i=>i.bought).length;
    block.innerHTML = `
      <div class="shop-cat-header">
        <span>${catLabel}</span>
        <span class="shop-cat-count">${boughtCount}/${items.length}</span>
      </div>
      ${items.map(item => `
        <div class="shop-item ${item.bought?'bought':''}" data-id="${item.id}">
          <input type="checkbox" ${item.bought?'checked':''}>
          <span class="shop-item-name">${escHtml(item.name)}</span>
          <button class="shop-item-del">×</button>
        </div>`).join('')}`;

    block.querySelectorAll('.shop-item').forEach(row => {
      const id = parseInt(row.dataset.id);
      row.querySelector('input').addEventListener('change', e => {
        const it = shopItems.find(i=>i.id===id);
        if (it) { it.bought = e.target.checked; saveShopItems(); renderShoppingList(); }
      });
      row.querySelector('.shop-item-del').addEventListener('click', () => {
        if (confirm('刪除此項目？')) {
          shopItems = shopItems.filter(i=>i.id!==id);
          saveShopItems(); renderShoppingList();
        }
      });
    });
    container.appendChild(block);
  });
}

document.getElementById('shop-add-btn').addEventListener('click', () => {
  const cat  = document.getElementById('shop-new-cat').value;
  const name = document.getElementById('shop-new-name').value.trim();
  if (!name) { showToast('請輸入商品名稱'); return; }
  shopItems.push({ id: Date.now(), cat, name, bought: false });
  saveShopItems(); renderShoppingList();
  document.getElementById('shop-new-name').value = '';
  showToast('已加入購物清單 ✓');
});
document.getElementById('shop-new-name').addEventListener('keydown', e => {
  if (e.key==='Enter') document.getElementById('shop-add-btn').click();
});

// ════════════════════════════════════════════
//  MOBILE NAV
// ════════════════════════════════════════════
(function initMobileNav() {
  const nav = document.getElementById('mobile-nav');
  if (!nav) return;
  // 預設顯示行程
  document.getElementById('itinerary-panel').classList.add('mobile-active');

  nav.querySelectorAll('.mnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if (panel === 'expense') { openExpenseModal(); return; }

      // Page tab 切換
      document.querySelectorAll('.page-tab').forEach(t => {
        if (t.dataset.page === panel) t.click();
      });

      if (panel === 'itinerary') {
        nav.querySelectorAll('.mnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('map-panel').classList.remove('mobile-active');
        document.getElementById('itinerary-panel').classList.add('mobile-active');
      }
      if (panel === 'map') {
        nav.querySelectorAll('.mnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('itinerary-panel').classList.remove('mobile-active');
        document.getElementById('map-panel').classList.add('mobile-active');
        setTimeout(() => map.invalidateSize(), 60);
      }
    });
  });
})();

// ════════════════════════════════════════════
//  TRANSIT SEARCH
// ════════════════════════════════════════════
(function initTransit() {
  // ── 站點資料庫（中文/英文 → 日文） ──
  const STATIONS = [
    { zh:'新宿',   en:'shinjuku',         ja:'新宿' },
    { zh:'澀谷',   en:'shibuya',          ja:'渋谷' },
    { zh:'池袋',   en:'ikebukuro',        ja:'池袋' },
    { zh:'淺草',   en:'asakusa',          ja:'浅草' },
    { zh:'上野',   en:'ueno',             ja:'上野' },
    { zh:'秋葉原', en:'akihabara',        ja:'秋葉原' },
    { zh:'東京',   en:'tokyo',            ja:'東京' },
    { zh:'原宿',   en:'harajuku',         ja:'原宿' },
    { zh:'表參道', en:'omotesando',       ja:'表参道' },
    { zh:'銀座',   en:'ginza',            ja:'銀座' },
    { zh:'台場',   en:'odaiba',           ja:'お台場海浜公園' },
    { zh:'築地',   en:'tsukiji',          ja:'築地' },
    { zh:'中目黑', en:'nakameguro',       ja:'中目黒' },
    { zh:'下北澤', en:'shimokitazawa',    ja:'下北沢' },
    { zh:'谷中',   en:'yanaka',           ja:'谷中' },
    { zh:'高圓寺', en:'koenji',           ja:'高円寺' },
    { zh:'吉祥寺', en:'kichijoji',        ja:'吉祥寺' },
    { zh:'六本木', en:'roppongi',         ja:'六本木' },
    { zh:'品川',   en:'shinagawa',        ja:'品川' },
    { zh:'羽田機場',en:'haneda',          ja:'羽田空港第3ターミナル' },
    { zh:'成田機場',en:'narita',          ja:'成田空港' },
    { zh:'惠比壽', en:'ebisu',            ja:'恵比寿' },
    { zh:'代官山', en:'daikanyama',       ja:'代官山' },
    { zh:'目黑',   en:'meguro',           ja:'目黒' },
    { zh:'自由之丘',en:'jiyugaoka',       ja:'自由が丘' },
    { zh:'二子玉川',en:'futakotamagawa',  ja:'二子玉川' },
    { zh:'赤坂',   en:'akasaka',          ja:'赤坂' },
    { zh:'四谷',   en:'yotsuya',          ja:'四ツ谷' },
    { zh:'神保町', en:'jimbocho',         ja:'神保町' },
    { zh:'飯田橋', en:'iidabashi',        ja:'飯田橋' },
    { zh:'浅草橋', en:'asakusabashi',     ja:'浅草橋' },
    { zh:'御茶之水',en:'ochanomizu',      ja:'御茶ノ水' },
    { zh:'水道橋', en:'suidobashi',       ja:'水道橋' },
    { zh:'豐洲',   en:'toyosu',           ja:'豊洲' },
    { zh:'月島',   en:'tsukishima',       ja:'月島' },
    { zh:'門前仲町',en:'monzennakacho',   ja:'門前仲町' },
    { zh:'清澄白河',en:'kiyosumishirakawa',ja:'清澄白河' },
    { zh:'押上',   en:'oshiage',          ja:'押上' },
    { zh:'錦糸町', en:'kinshicho',        ja:'錦糸町' },
    { zh:'代代木', en:'yoyogi',           ja:'代々木' },
    { zh:'千駄谷', en:'sendagaya',        ja:'千駄ケ谷' },
    { zh:'北千住', en:'kitasenju',        ja:'北千住' },
    { zh:'日暮里', en:'nippori',          ja:'日暮里' },
    { zh:'鶯谷',   en:'uguisudani',       ja:'鶯谷' },
    { zh:'根津',   en:'nezu',             ja:'根津' },
    { zh:'湯島',   en:'yushima',          ja:'湯島' },
    { zh:'御徒町', en:'okachimachi',      ja:'御徒町' },
    { zh:'秋葉原', en:'akihabara',        ja:'秋葉原' },
    { zh:'有楽町', en:'yurakucho',        ja:'有楽町' },
    { zh:'新橋',   en:'shimbashi',        ja:'新橋' },
    { zh:'濱松町', en:'hamamatsucho',     ja:'浜松町' },
    { zh:'田町',   en:'tamachi',          ja:'田町' },
    { zh:'大崎',   en:'osaki',            ja:'大崎' },
    { zh:'五反田', en:'gotanda',          ja:'五反田' },
    { zh:'武藏小山',en:'musashikoyama',   ja:'武蔵小山' },
    { zh:'西新宿', en:'nishishinjuku',    ja:'西新宿' },
    { zh:'新宿三丁目',en:'shinjukusanchome',ja:'新宿三丁目' },
    { zh:'明治神宮前',en:'meijijingumae', ja:'明治神宮前' },
  ];

  function matchStations(q) {
    if (!q || q.length < 1) return [];
    const lower = q.toLowerCase();
    return STATIONS.filter(s =>
      s.zh.includes(q) || s.ja.includes(q) || s.en.includes(lower)
    ).slice(0, 8);
  }

  // ── 自動完成 ──
  function setupAutocomplete(inputEl, suggEl) {
    inputEl.addEventListener('input', () => {
      const q = inputEl.value.trim();
      const matches = matchStations(q);
      if (!matches.length || !q) { suggEl.classList.add('hidden'); return; }
      suggEl.innerHTML = matches.map(s =>
        `<div class="transit-sugg-item" data-ja="${escHtml(s.ja)}">
          <span class="sugg-zh">${escHtml(s.zh)}</span>
          <span class="sugg-ja">${escHtml(s.ja)}</span>
          <span class="sugg-en">${escHtml(s.en)}</span>
        </div>`
      ).join('');
      suggEl.classList.remove('hidden');
    });
    suggEl.addEventListener('click', e => {
      const item = e.target.closest('.transit-sugg-item');
      if (!item) return;
      inputEl.value = item.dataset.ja;
      suggEl.classList.add('hidden');
    });
    document.addEventListener('click', e => {
      if (!inputEl.contains(e.target) && !suggEl.contains(e.target))
        suggEl.classList.add('hidden');
    });
  }

  const fromEl    = document.getElementById('transit-from');
  const toEl      = document.getElementById('transit-to');
  const fromSugg  = document.getElementById('transit-from-sugg');
  const toSugg    = document.getElementById('transit-to-sugg');
  const swapBtn   = document.getElementById('transit-swap');
  const searchBtn = document.getElementById('transit-search-btn');
  const resultsEl = document.getElementById('transit-results');
  const histWrap  = document.getElementById('transit-history-wrap');
  const histList  = document.getElementById('transit-history-list');

  setupAutocomplete(fromEl, fromSugg);
  setupAutocomplete(toEl, toSugg);

  // ── 快選站點 ──
  let quickTarget = 'from';
  document.getElementById('transit-quick-grid').addEventListener('click', e => {
    const btn = e.target.closest('.transit-q-btn');
    if (!btn) return;
    if (quickTarget === 'from') { fromEl.value = btn.dataset.station; quickTarget = 'to'; }
    else                        { toEl.value   = btn.dataset.station; quickTarget = 'from'; }
  });
  fromEl.addEventListener('focus', () => { quickTarget = 'from'; });
  toEl.addEventListener('focus',   () => { quickTarget = 'to'; });

  // ── 交換 ──
  swapBtn.addEventListener('click', () => {
    [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  });

  // ── 歷史記錄 ──
  function loadHistory() { return JSON.parse(localStorage.getItem('transit_history') || '[]'); }
  function saveHistory(from, to) {
    const hist = loadHistory().filter(h => !(h.from === from && h.to === to));
    hist.unshift({ from, to });
    localStorage.setItem('transit_history', JSON.stringify(hist.slice(0, 8)));
    renderHistory();
  }
  function renderHistory() {
    const hist = loadHistory();
    if (!hist.length) { histWrap.classList.add('hidden'); return; }
    histWrap.classList.remove('hidden');
    histList.innerHTML = hist.map((h, i) =>
      `<div class="transit-hist-item">
        <span class="transit-hist-route">${escHtml(h.from)} → ${escHtml(h.to)}</span>
        <button class="transit-hist-use" data-i="${i}">套用</button>
      </div>`
    ).join('');
  }
  histList.addEventListener('click', e => {
    const btn = e.target.closest('.transit-hist-use');
    if (!btn) return;
    const h = loadHistory()[+btn.dataset.i];
    if (!h) return;
    fromEl.value = h.from; toEl.value = h.to;
  });
  renderHistory();

  // ── 渲染路線結果 ──
  const PRIORITY_LABEL = { '早':'最快', '楽':'少換', '安':'最便宜', '':'', '始':'首班', '終':'末班' };
  const PRIORITY_COLOR = { '早':'#E74C3C', '楽':'#27AE60', '安':'#2980B9', '':'#888' };

  function renderRoutes(data) {
    if (!data.routes || !data.routes.length) {
      resultsEl.innerHTML = '<div class="transit-no-result">查無路線，請確認站名是否正確</div>';
      resultsEl.classList.remove('hidden');
      return;
    }
    const srcUrl = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(data.from)}&to=${encodeURIComponent(data.to)}`;
    resultsEl.innerHTML = `
      <div class="transit-result-header">
        <span class="transit-result-title">${escHtml(data.from)} → ${escHtml(data.to)}</span>
        <a class="transit-yahoo-link" href="${escHtml(srcUrl)}" target="_blank" rel="noopener">在 Yahoo 開啟</a>
      </div>
      ${data.routes.map(r => {
        const priColor = PRIORITY_COLOR[r.priority] || '#888';
        const priLabel = PRIORITY_LABEL[r.priority] || r.priority;
        const stationsHtml = r.stations.map((st, si) => {
          const isFirst = si === 0, isLast = si === r.stations.length - 1;
          const timeStr = st.times.join(' / ');
          const leg = r.legs[si];
          return `
            <div class="tr-station ${isFirst ? 'tr-dep' : isLast ? 'tr-arr' : 'tr-mid'}">
              <div class="tr-st-time">${escHtml(timeStr)}</div>
              <div class="tr-st-dot"></div>
              <div class="tr-st-info">
                <div class="tr-st-name">${escHtml(st.name)}</div>
                ${leg ? `<div class="tr-leg">
                  <span class="tr-leg-line">${escHtml(leg.line)}</span>
                  ${leg.platform ? `<span class="tr-leg-platform">${escHtml(leg.platform)}</span>` : ''}
                  ${leg.position ? `<span class="tr-leg-pos">${escHtml(leg.position)}</span>` : ''}
                  ${leg.stops ? `<span class="tr-leg-stops">${escHtml(leg.stops)}</span>` : ''}
                </div>` : ''}
              </div>
            </div>`;
        }).join('');
        return `
          <div class="transit-route-card">
            <div class="tr-card-header">
              <span class="tr-route-num">路線 ${r.index}</span>
              ${r.priority ? `<span class="tr-priority" style="background:${priColor}">${priLabel}</span>` : ''}
              <span class="tr-time-range">${escHtml(r.depArr)}</span>
              <span class="tr-duration">${escHtml(r.duration)}</span>
              <span class="tr-transfers">${escHtml(r.transfers)}</span>
              <span class="tr-fare">${escHtml(r.fare)}</span>
            </div>
            <div class="tr-card-body">${stationsHtml}</div>
          </div>`;
      }).join('')}`;
    resultsEl.classList.remove('hidden');
  }

  // ── 搜尋（呼叫後端 proxy） ──
  searchBtn.addEventListener('click', async () => {
    const from = fromEl.value.trim();
    const to   = toEl.value.trim();
    if (!from || !to) { alert('請輸入出發地和目的地'); return; }

    const dateVal = document.getElementById('transit-date').value;
    const timeVal = document.getElementById('transit-time').value;
    const way     = document.getElementById('transit-way').value;
    const [hh, mm] = timeVal.split(':');
    const y = dateVal.slice(0,4), m = dateVal.slice(4,6), d = dateVal.slice(6,8);

    resultsEl.innerHTML = '<div class="transit-loading">🔍 搜尋中…</div>';
    resultsEl.classList.remove('hidden');
    searchBtn.disabled = true;

    try {
      const res = await fetch(`/api/transit?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&y=${y}&m=${m}&d=${d}&hh=${hh}&m1=${mm[0]}&m2=${mm[1]}&way=${way}`);
      const data = await res.json();
      if (data.error) { resultsEl.innerHTML = `<div class="transit-no-result">錯誤：${escHtml(data.error)}</div>`; }
      else { renderRoutes(data); saveHistory(from, to); }
    } catch(e) {
      resultsEl.innerHTML = '<div class="transit-no-result">連線失敗，請稍後再試</div>';
    }
    searchBtn.disabled = false;
  });
})();

// ════════════════════════════════════════════
//  SYNC（多裝置共用同一 Flask server）
// ════════════════════════════════════════════
const SYNC_KEYS = ['prep_vjw', 'prep_tickets', 'prep_luggage', 'prep_carry',
                   'shopping_list', 'member-a-name', 'member-b-name'];

async function syncPush(key, value) {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  } catch (_) {}
}

async function syncPull() {
  try {
    const res = await fetch('/api/sync');
    const data = await res.json();
    let changed = false;
    for (const k of SYNC_KEYS) {
      if (data[k] !== undefined) {
        const local = localStorage.getItem(k);
        const remote = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
        if (local !== remote) {
          localStorage.setItem(k, remote);
          changed = true;
        }
      }
    }
    if (changed) {
      initPrepChecklists();
      renderShoppingList();
      const a = localStorage.getItem('member-a-name');
      const b = localStorage.getItem('member-b-name');
      if (a) { const el = document.getElementById('member-a'); if (el) el.value = a; }
      if (b) { const el = document.getElementById('member-b'); if (el) el.value = b; }
    }
    updateSyncIndicator('已同步');
  } catch (_) { updateSyncIndicator('離線'); }
}

function updateSyncIndicator(text) {
  const el = document.getElementById('sync-indicator');
  if (el) { el.textContent = text === '已同步' ? '☁ 已同步' : '⚡ 離線'; el.dataset.state = text === '已同步' ? 'ok' : 'offline'; }
}

// 攔截 localStorage.setItem 以在儲存時自動同步到 server
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (SYNC_KEYS.includes(key)) syncPush(key, value);
};

// 成員名稱變更時同步
['member-a', 'member-b'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    localStorage.setItem(`${id}-name`, el.value);
  });
});

// 定期拉取（每 30 秒）
setInterval(syncPull, 30000);

// ════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════
(async () => {
  await loadItinerary();
  await loadPlaces();
  await loadExpenses();
  initPrepChecklists();
  renderShoppingList();
  updateCountdown();
  updatePrepProgress();
  await syncPull();
})();

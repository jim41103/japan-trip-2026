// ════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════
const HOTEL = {
  name: '淺草田原町站前APA飯店',
  description: '住宿', lat: 35.710269, lng: 139.7901016, type: 'hotel',
  googleMapsUrl: '',
};
const HOTEL_FUJI = {
  name: 'HOTEL FUJiTORiiGATE（ホテル富士トリイゲート）',
  description: '住宿', lat: 35.4828938, lng: 138.7967342, type: 'hotel',
  googleMapsUrl: 'https://maps.app.goo.gl/xDJqon45c7W1vL2HA',
};
const HOTEL_BY_DATE = {
  '2026-08-03': HOTEL,
  '2026-08-04': HOTEL,
  '2026-08-05': HOTEL,
  '2026-08-06': HOTEL,
  '2026-08-07': HOTEL,
  '2026-08-08': HOTEL_FUJI,
  '2026-08-09': null,  // 返台日，無住宿
};
const NEARBY_RADIUS_KM = 1.0;
const DAY_SHORT = {
  '2026-08-03': '8/3 (一)', '2026-08-04': '8/4 (二)',
  '2026-08-05': '8/5 (三)', '2026-08-06': '8/6 (四)',
  '2026-08-07': '8/7 (五)', '2026-08-08': '8/8 (六)',
  '2026-08-09': '8/9 (日)',
};
const CAT_EMOJI  = { food:'🍽', ticket:'🎫', transport:'🚌', shopping:'🛍', hotel:'🏨', medicine:'💊', other:'📦' };
const CAT_LABEL  = { food:'餐飲', ticket:'票券', transport:'交通', shopping:'購物', hotel:'住宿', medicine:'藥妝', other:'其他' };
const SHOP_CAT   = { medicine:'💊 藥妝', food:'🍬 食品/零食', fashion:'👗 服飾', souvenir:'🎁 伴手禮', other:'📦 其他' };

// ════════════════════════════════════════════
//  SEARCH SYNONYMS & FUZZY SEARCH
// ════════════════════════════════════════════
const SEARCH_SYNONYMS = {
  '餐廳': ['食','料理','餐','飯','麵','壽司','拉麵','燒肉','居酒屋','咖啡','甜點','蛋糕','restaurant','food','cafe','ramen','sushi','izakaya'],
  '吃':   ['食','料理','餐','飯','麵','壽司','拉麵','燒肉','居酒屋','咖啡','甜點','restaurant','food'],
  '咖啡': ['café','cafe','coffee','珈琲','カフェ'],
  '甜點': ['dessert','sweets','菓子','和菓子','パン','麵包','bakery'],
  '購物': ['shop','store','商場','百貨','藥妝','超市','便利','免稅','市集','mall','market'],
  '藥妝': ['drugstore','matsumoto','松本','唐吉軻德','don quijote','コスメ'],
  '景點': ['觀光','寺','神社','公園','博物館','美術館','展望','市場','街道','park','temple','shrine','museum','tower'],
  '寺':   ['寺院','temple','お寺'],
  '神社': ['shrine','神宮','jinja'],
  '公園': ['garden','庭園','花園','park'],
  '住宿': ['飯店','旅館','hotel','hostel','民宿','旅店'],
  '車站': ['station','駅','eki','地鐵','地下鐵','電車'],
};

function expandQuery(query) {
  const q = query.toLowerCase().trim();
  const terms = new Set([q]);
  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (key.includes(q) || q.includes(key)) synonyms.forEach(s => terms.add(s.toLowerCase()));
    if (synonyms.some(s => s.toLowerCase().includes(q) || q.includes(s.toLowerCase()))) {
      terms.add(key.toLowerCase());
      synonyms.forEach(s => terms.add(s.toLowerCase()));
    }
  }
  return [...terms];
}

function fuzzyScore(target, query) {
  if (!target || !query) return 0;
  const t = target.toLowerCase(), q = query.toLowerCase();
  if (t === q) return 1;
  if (t.includes(q)) return 0.9;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) { if (t[ti] === q[qi]) qi++; }
  if (qi === q.length) return 0.5;
  return 0;
}

function searchPlaces(query) {
  if (!query || !query.trim()) return allPlaces;
  const terms = expandQuery(query.trim());
  return allPlaces
    .map(place => {
      const fields = [place.name||'', place.description||'', place.type||'', place.note||''].map(f => f.toLowerCase());
      let best = 0;
      for (const term of terms) for (const field of fields) { const s = fuzzyScore(field, term); if (s > best) best = s; }
      return { place, score: best };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let allPlaces = [], filteredPlaces = [], itinerary = {}, notionPages = [], expenses = [];
let markers = {}, activeFilter = 'all', activeNotionTab = 0;
let shopItems = JSON.parse(localStorage.getItem('shopItems') || 'null') || defaultShopItems();

// ════════════════════════════════════════════
//  WEATHER MODAL (Landing)
// ════════════════════════════════════════════
const WEATHER_LAT = 35.7148, WEATHER_LNG = 139.7967;

function tenkiEmoji(c) {
  if (!c) return '🌡'; if (/晴/.test(c)) return '☀️'; if (/くもり|曇/.test(c)) return '☁️';
  if (/雷/.test(c)) return '⛈'; if (/雪/.test(c)) return '❄️'; if (/雨/.test(c)) return '🌧'; return '🌡';
}

function openWeatherModal() {
  document.getElementById('weatherModal').style.display = 'flex';
  loadHourlyWeather();
  loadWeeklyWeather();
}
function closeWeatherModal() {
  document.getElementById('weatherModal').style.display = 'none';
}

async function loadWeatherCardPreview() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LNG}&current_weather=true&timezone=Asia%2FTokyo`;
    const data = await (await fetch(url)).json();
    const cw = data.current_weather;
    const [emoji] = wmo(cw.weathercode);
    document.getElementById('weatherCardIcon').textContent = emoji;
    document.getElementById('weatherCardDesc').textContent = `${Math.round(cw.temperature)}° · 東京淺草`;
  } catch(e) { /* keep default */ }
}

async function loadHourlyWeather() {
  const strip = document.getElementById('hourlyStrip');
  if (!strip) return;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LNG}&hourly=temperature_2m,precipitation_probability,weathercode&timezone=Asia%2FTokyo&forecast_days=2`;
    const h = (await (await fetch(url)).json()).hourly;
    const now = new Date(), nowH = now.getHours(), todayStr = now.toISOString().slice(0,10);
    const si = h.time.findIndex(t => t.startsWith(todayStr) && parseInt(t.slice(11,13)) >= nowH);
    if (si === -1) { strip.innerHTML = '<div class="weather-loading">資料暫時無法取得</div>'; return; }
    strip.innerHTML = h.time.slice(si, si+24).map((t, i) => {
      const idx = si+i, [emoji] = wmo(h.weathercode[idx]);
      return `<div class="hourly-item${i===0?' hourly-now':''}">
        <div class="hi-time">${i===0?'現在':t.slice(11,16)}</div>
        <div class="hi-icon">${emoji}</div>
        <div class="hi-temp">${Math.round(h.temperature_2m[idx])}°</div>
        <div class="hi-rain">💧${h.precipitation_probability[idx]??'--'}%</div>
      </div>`;
    }).join('');
  } catch(e) { strip.innerHTML = '<div class="weather-loading">載入失敗</div>'; }
}

async function loadWeeklyWeather() {
  const row = document.getElementById('weeklyRow');
  if (!row) return;
  const DN = ['日','一','二','三','四','五','六'];
  try {
    const tj = await (await fetch('/api/tenki-weekly')).json();
    if (tj.days && tj.days.length > 0) {
      row.innerHTML = tj.days.slice(0,7).map(d => {
        const emoji = tenkiEmoji(d.condition);
        const dt = new Date(d.date+'T12:00:00+09:00');
        const label = `${dt.getMonth()+1}/${dt.getDate()}(${DN[dt.getDay()]})`;
        return `<div class="weekly-item">
          <div class="wi-date">${label}</div><div class="wi-icon">${emoji}</div>
          <div class="wi-cond">${d.condition||''}</div>
          <div class="wi-temp"><span class="temp-hi">${d.hi??'--'}°</span><span class="temp-sep">/</span><span class="temp-lo">${d.lo??'--'}°</span></div>
          <div class="wi-rain">💧${d.rainPct??'--'}%</div>
        </div>`;
      }).join('');
      return;
    }
  } catch(e) { /* fall through to fallback */ }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LNG}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=7`;
    const d = (await (await fetch(url)).json()).daily;
    row.innerHTML = d.time.map((date, i) => {
      const [emoji, cond] = wmo(d.weathercode[i]);
      const dt = new Date(date+'T12:00:00+09:00');
      const label = `${dt.getMonth()+1}/${dt.getDate()}(${DN[dt.getDay()]})`;
      return `<div class="weekly-item">
        <div class="wi-date">${label}</div><div class="wi-icon">${emoji}</div>
        <div class="wi-cond">${cond}</div>
        <div class="wi-temp"><span class="temp-hi">${Math.round(d.temperature_2m_max[i])}°</span><span class="temp-sep">/</span><span class="temp-lo">${Math.round(d.temperature_2m_min[i])}°</span></div>
        <div class="wi-rain">💧${d.precipitation_probability_max[i]??'--'}%</div>
      </div>`;
    }).join('');
  } catch(e) { row.innerHTML = '<div class="weather-loading">一週天氣載入失敗</div>'; }
}

// ════════════════════════════════════════════
//  SPLASH → LANDING
// ════════════════════════════════════════════
setTimeout(() => {
  const s = document.getElementById('splash');
  if (!s) return;
  s.classList.add('splitting');
  setTimeout(() => {
    s.style.display = 'none';
    showLanding();
  }, 750);
}, 2800);

function showLanding() {
  const landing = document.getElementById('landing');
  if (!landing) return;
  landing.style.display = 'flex';
  showFloatingButtons(false);
  const cd = document.getElementById('landingCountdown');
  const daysLeft = Math.ceil((new Date('2026-08-03') - new Date()) / 86400000);
  if (cd) cd.textContent = daysLeft > 0 ? `✈ 還有 ${daysLeft} 天出發！` : '🎉 旅程進行中！';
  document.querySelectorAll('.landing-card[data-tab]').forEach(card => {
    card.onclick = () => {
      const tab = card.dataset.tab;
      landing.classList.add('landing-exit');
      setTimeout(() => {
        landing.style.display = 'none';
        landing.classList.remove('landing-exit');
        switchTab(tab);
        showFloatingButtons(true);
      }, 300);
    };
  });
  loadWeatherCardPreview();
}

let activeSection = 'itinerary';

function switchTab(tabName) {
  activeSection = tabName;
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById('section-' + tabName);
  if (!target) return;
  target.style.display = '';
  target.classList.add('active');
  target.classList.add('section-enter');
  target.addEventListener('animationend', () => target.classList.remove('section-enter'), { once: true });
  if (tabName === 'itinerary') {
    document.getElementById('itinerary-panel')?.classList.add('mobile-active');
    document.getElementById('map-panel')?.classList.remove('mobile-active');
    setTimeout(() => map.invalidateSize(), 50);
    try { renderItinerary(); drawRouteLines(); } catch(e) { console.error('[switchTab itinerary]', e); }
  }
  if (tabName === 'shopping') renderShoppingList();
  if (tabName === 'ledger') {
    syncPaidByOptions(); renderExpenseList(); renderSettle();
    drawSpendingChart(expenses); updateCurrencyConvert();
  }
  if (tabName === 'prep') updatePrepRing();
  if (tabName === 'diary') renderDiary();
  // 如 AI 抽屜開著，同步更新快捷提示
  const drawer = document.getElementById('aiDrawer');
  if (drawer && drawer.style.display !== 'none') renderAIQuickPrompts(tabName);
}

function showFloatingButtons(show) {
  document.getElementById('floatAIBtn').style.display = show ? 'flex' : 'none';
  document.getElementById('homeBtn').style.display    = show ? 'flex' : 'none';
}

// Home button → back to landing
document.getElementById('homeBtn').addEventListener('click', () => {
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  showLanding();
});

// Floating AI button → open global AI drawer
document.getElementById('floatAIBtn').addEventListener('click', () => {
  const drawer = document.getElementById('aiDrawer');
  drawer.style.display = 'flex';
  requestAnimationFrame(() => drawer.classList.add('ai-drawer-open'));
  renderAIQuickPrompts(activeSection);
  document.getElementById('aiInput').focus();
});

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
    const page = tab.dataset.page;
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    switchTab(page);
  });
});

// 點擊 Header 標題 → 返回 Landing
document.querySelector('.header-title').addEventListener('click', () => {
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  showLanding();
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

function formatAIText(str) {
  return String(str)
    .replace(/```[\s\S]*?```/g, '')  // 移除 code block
    .replace(/`[^`]*`/g, '')         // 移除 inline code
    .replace(/\*+/g, '')             // 移除 markdown 星號
    .replace(/#+ /g, '')             // 移除 markdown 標題符號
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => escHtml(line))
    .join('<br>');
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

function renderPlacesList(places) {
  if (places === undefined) places = filteredPlaces;
  const ul = document.getElementById('places-list');
  if (!ul) return;
  ul.innerHTML = '';
  if (places.length === 0) {
    ul.innerHTML = '<div class="place-empty">找不到相關地點</div>';
    initPlaceListDrag();
    return;
  }
  places.forEach((place, idx) => {
    const li = document.createElement('li');
    li.className = 'place-item';
    li.dataset.placeId = place.id !== undefined ? place.id : idx;
    const mapsUrl = place.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
    const dot = place.type === 'restaurant' ? '🍽' : '🏯';
    li.innerHTML = `
      <span class="place-type-dot type-${place.type || 'other'}">${dot}</span>
      <span class="place-name">${escHtml(place.name)}</span>
      <a class="place-map-link" href="${mapsUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🗺</a>`;
    li.addEventListener('click', e => {
      if (e.target.closest('.place-map-link')) return;
      flyToPlace(idx);
      showNearbyByIdx(idx);
    });
    ul.appendChild(li);
  });
  initPlaceListDrag();
}

function initPlaceListDrag() {
  const listEl = document.getElementById('places-list');
  if (!listEl) return;
  Sortable.create(listEl, {
    group: { name: 'places', pull: 'clone', put: false },
    sort: false,
    animation: 120,
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    onClone(evt) {
      evt.clone.dataset.placeId = evt.item.dataset.placeId;
    },
  });
}

function highlightListItem(idx) {
  document.querySelectorAll('#places-list li').forEach(li => li.classList.remove('highlighted'));
  const lis = document.querySelectorAll('#places-list li');
  const target = lis[idx];
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
  const q = document.getElementById('search-input').value.trim();
  if (q) {
    filteredPlaces = searchPlaces(q).filter(p => activeFilter === 'all' || p.type === activeFilter);
  } else {
    filteredPlaces = activeFilter === 'all' ? allPlaces : allPlaces.filter(p => p.type === activeFilter);
  }
  renderPlacesList(filteredPlaces);
  renderMarkers();
  updateCount();
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
//  LOCKED FLIGHT DATA
// ════════════════════════════════════════════
const FLIGHT_OUTBOUND = {
  id: 'flight-outbound',
  name: '✈ GK12 桃園T1 02:40 → 成田T2 07:00',
  time: '02:40',
  type: 'transport',
  locked: true,
  note: 'Jetstar Japan GK12 | 訂位：YQETNT',
  icon: '✈',
  lat: 0, lng: 0, description: '',
};
const FLIGHT_RETURN = {
  id: 'flight-return',
  name: '✈ GK11 成田T3 22:40 → 桃園T1 01:30(+1)',
  time: '22:40',
  type: 'transport',
  locked: true,
  note: 'Jetstar Japan GK11 | 訂位：ZPNERW | 野狼11F 美珊11E',
  icon: '✈',
  lat: 0, lng: 0, description: '',
};

function ensureDays() {
  Object.keys(DAY_SHORT).forEach(date => {
    if (!itinerary[date]) {
      itinerary[date] = { label: DAY_SHORT[date], places: [] };
    }
  });
}

function ensureFlights() {
  if (itinerary['2026-08-03']) {
    const places = itinerary['2026-08-03'].places || [];
    if (!places.some(p => p.id === 'flight-outbound')) {
      itinerary['2026-08-03'].places = [FLIGHT_OUTBOUND, ...places];
    }
  }
  if (itinerary['2026-08-09']) {
    const places = itinerary['2026-08-09'].places || [];
    if (!places.some(p => p.id === 'flight-return')) {
      itinerary['2026-08-09'].places = [...places, FLIGHT_RETURN];
    }
  }
}

// ════════════════════════════════════════════
//  LOAD ITINERARY
// ════════════════════════════════════════════
async function loadItinerary() {
  try {
    const res = await fetch('/itinerary.json');
    itinerary = await res.json();
  } catch (e) {
    console.warn('itinerary.json 載入失敗，使用空行程', e);
  }
  ensureDays();
  ensureFlights();
  try { renderItinerary(); drawRouteLines(); renderRouteLegend(); } catch(e) { console.error('[loadItinerary] render:', e); }
  // 背景從 Gist 拉最新版，有差異再重新渲染
  fetch('/api/sync')
    .then(r => r.json())
    .then(syncData => {
      if (!syncData.itinerary) return;
      const remote = JSON.parse(syncData.itinerary);
      itinerary = remote;
      ensureDays();
      ensureFlights();
      // 保存當前容器內容，若 renderItinerary 失敗則不清空
      const container = document.getElementById('itinerary-days');
      const backup = container ? container.innerHTML : '';
      try {
        renderItinerary();
        drawRouteLines();
      } catch (e) {
        console.error('sync 後重新渲染失敗', e);
        if (container && backup) container.innerHTML = backup;
      }
    })
    .catch(() => {});
}

// ════════════════════════════════════════════
//  RENDER ITINERARY
// ════════════════════════════════════════════
function renderItinerary() {
  const container = document.getElementById('itinerary-days');
  if (!container) { console.error('[renderItinerary] #itinerary-days not found'); return; }
  const keys = Object.keys(itinerary);
  console.log('[renderItinerary] itinerary keys:', keys.length, keys);
  // 如果 itinerary 為空，確保至少有 7 天
  Object.keys(DAY_SHORT).forEach(d => {
    if (!itinerary[d]) itinerary[d] = { label: DAY_SHORT[d], places: [] };
  });
  container.innerHTML = '';
  Object.entries(itinerary).forEach(([date, day]) => {
    const col = document.createElement('div');
    col.className = 'day-column';
    col.dataset.date = date;
    const density = getDayDensity(day.places || []);
    col.innerHTML = `
      <div class="day-header">
        <span>${DAY_SHORT[date] || day.label}<span class="density-pill ${density.cls}">${density.label}</span></span>
        <div class="day-header-btns">
          <button class="btn-optimize" onclick="optimizeDay('${date}')" title="依地理位置自動排序當天行程順序">🗺</button>
        </div>
      </div>
      <div class="day-places" id="day-${date}"></div>
      <div class="day-notes-wrap">
        <div class="day-notes-label">📝 備注</div>
        <textarea class="day-notes" data-date="${date}" placeholder="新增當日備注…" rows="2">${escHtml(day.notes||'')}</textarea>
      </div>`;
    container.appendChild(col);

    // 條件渲染飯店 footer（8/9 返台日無住宿）
    const hotel = HOTEL_BY_DATE[date];
    if (hotel) {
      const footer = document.createElement('div');
      footer.className = 'day-hotel-footer';
      footer.innerHTML = `
        <div class="hotel-card">
          <span class="hotel-icon">🏨</span>
          <span class="hotel-name">${escHtml(hotel.name)}</span>
          <a class="hotel-gmaps" href="${hotel.googleMapsUrl || googleMapsUrl(hotel)}" target="_blank" rel="noopener" title="在 Google Maps 查看">📍</a>
          <span class="hotel-badge">住宿</span>
        </div>`;
      col.appendChild(footer);
    }

    const placesList = col.querySelector('.day-places');
    renderDayPlaces(placesList, date);
    Sortable.create(placesList, {
      group: { name: 'places', pull: true, put: true },
      animation: 150,
      filter: '.iplace-locked',
      ghostClass: 'drag-ghost',
      chosenClass: 'drag-chosen',
      onAdd(evt) {
        const placeId = evt.item.dataset.placeId;
        if (!placeId) { evt.item.remove(); return; }
        const pidx = parseInt(placeId);
        const place = isNaN(pidx) ? allPlaces.find(p => String(p.id) === String(placeId)) : allPlaces[pidx];
        evt.item.remove();
        if (!place) return;
        if (!itinerary[date]) itinerary[date] = { label: DAY_SHORT[date], places: [] };
        if (!itinerary[date].places.some(p => p.name === place.name)) {
          itinerary[date].places.push({
            name: place.name,
            time: '',
            type: place.type || 'attraction',
            description: place.description || '',
            lat: place.lat || 0,
            lng: place.lng || 0,
            googleMapsUrl: place.googleMapsUrl || '',
          });
          renderDayPlaces(placesList, date);
          drawRouteLines();
          showToast(`✓ 已加入 ${DAY_SHORT[date]}`);
        } else {
          showToast('此地點已在行程中');
        }
      },
      onEnd(evt) {
        if (evt.from !== evt.to || evt.oldIndex !== evt.newIndex) {
          syncItineraryFromDOM();
        }
      },
    });

    // Notes auto-save
    col.querySelector('.day-notes').addEventListener('blur', () => {
      const txt = col.querySelector(`.day-notes[data-date="${date}"]`).value;
      if (itinerary[date]) itinerary[date].notes = txt;
    });

  });
}

function getDayDensity(places) {
  const count = (places || []).filter(p => p.time && p.time !== '--未定--').length;
  if (count >= 5) return { label: '密', cls: 'density-full' };
  if (count >= 3) return { label: '適', cls: 'density-mid' };
  return { label: '鬆', cls: 'density-light' };
}

function buildTimeOptions(selected) {
  let html = '<option value="">-- 未定 --</option>';
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      html += `<option value="${val}"${val === selected ? ' selected' : ''}>${val}</option>`;
    }
  }
  return html;
}

function renderDayPlaces(container, date) {
  container.innerHTML = '';
  const places = itinerary[date]?.places || [];
  if (places.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'drag-hint';
    hint.innerHTML = '<span class="drag-hint-icon">👈</span><span>從左側拖入地點開始規劃</span>';
    container.appendChild(hint);
    return;
  }
  // 有時間的依早→晚排序，無時間排最後（保持原有相對順序）
  const timed   = places.filter(p => p.time).sort((a, b) => a.time.localeCompare(b.time));
  const untimed = places.filter(p => !p.time);
  const sorted  = [...timed, ...untimed];
  itinerary[date].places = sorted;
  sorted.forEach((place, pIdx) => container.appendChild(makePlaceCard(place, date, pIdx)));
}

function makePlaceCard(place, date, pIdx) {
  const card = document.createElement('div');
  card.dataset.name = place.name;
  card.dataset.lat  = place.lat || 0;
  card.dataset.lng  = place.lng || 0;
  card.dataset.type = place.type;
  card.dataset.description = place.description || '';
  card.dataset.time = place.time || '';

  // 鎖定的航班卡片（不可拖曳、不可刪除）
  if (place.locked) {
    card.className = 'itinerary-place iplace-locked';
    card.dataset.locked = 'true';
    card.dataset.id   = place.id || '';
    card.dataset.note = place.note || '';
    card.dataset.icon = place.icon || '✈';
    card.innerHTML = `
      <div class="iplace-top">
        <span class="iplace-icon">${place.icon || '✈'}</span>
        <div class="iplace-info" style="min-width:0">
          <div class="iplace-name" style="font-size:11px;white-space:normal;line-height:1.3">${escHtml(place.name)}</div>
        </div>
      </div>
      ${place.note ? `<div class="iplace-locked-note">${escHtml(place.note)}</div>` : ''}
      <div class="iplace-bottom">
        <span class="iplace-time-badge">${escHtml(place.time || '')}</span>
      </div>`;
    return card;
  }

  const icon = place.type==='restaurant' ? '🍽' : place.type==='hotel' ? '🏨' : place.type==='transport' ? '🚌' : '🏯';
  card.className = 'itinerary-place';
  card.innerHTML = `
    <div class="iplace-top">
      <span class="iplace-icon">${icon}</span>
      <div class="iplace-info">
        <div class="iplace-name" title="${escHtml(place.name)}">${escHtml(place.name)}</div>
      </div>
      <div class="iplace-actions">
        <a class="iplace-gmaps" href="${googleMapsUrl(place)}" target="_blank" rel="noopener" title="Google Maps" onclick="event.stopPropagation()">📍</a>
        <button class="iplace-remove" title="移除" data-date="${date}" data-idx="${pIdx}">×</button>
      </div>
    </div>
    <div class="iplace-bottom">
      <select class="iplace-time" title="預計時間" onclick="event.stopPropagation()">
        ${buildTimeOptions(place.time || '')}
      </select>
    </div>`;
  card.querySelector('.iplace-time').addEventListener('change', function() {
    card.dataset.time = this.value;
    syncItineraryFromDOM();
    // 重新排序顯示
    const col = document.getElementById(`day-${date}`);
    if (col) renderDayPlaces(col, date);
    if (timelineMode) renderTimelineView();
  });
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
    itinerary[date].places = Array.from(cards).map(card => {
      const base = {
        name: card.dataset.name,
        lat: parseFloat(card.dataset.lat) || 0,
        lng: parseFloat(card.dataset.lng) || 0,
        type: card.dataset.type,
        description: card.dataset.description || '',
        time: card.querySelector?.('.iplace-time')?.value || card.dataset.time || '',
      };
      if (card.dataset.locked === 'true') {
        Object.assign(base, {
          locked: true,
          id:   card.dataset.id   || '',
          note: card.dataset.note || '',
          icon: card.dataset.icon || '',
        });
      }
      return base;
    });
    if (cards.length === 0) {
      container.innerHTML = '';
      const hint = document.createElement('div');
      hint.className = 'drag-hint';
      hint.innerHTML = '<span class="drag-hint-icon">👈</span><span>從左側拖入地點開始規劃</span>';
      container.appendChild(hint);
    }
  });
  drawRouteLines();
  if (timelineMode) renderTimelineView();
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
  // 收集 notes
  Object.keys(itinerary).forEach(date => {
    const notesEl = document.querySelector(`.day-notes[data-date="${date}"]`);
    if (notesEl) itinerary[date].notes = notesEl.value;
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
  '2026-08-09': '#D35400',
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

// 地圖自動 fit 到當日地點
function fitMapToDay(dayKey) {
  const places = (itinerary[dayKey]?.places || []).filter(p => p.lat && p.lng);
  if (!places.length) return;
  const group = L.featureGroup(places.map(p => L.marker([p.lat, p.lng])));
  map.fitBounds(group.getBounds().pad(0.25), { animate: true, duration: 0.8 });
}

// 全圖按鈕
document.getElementById('mapResetBtn')?.addEventListener('click', () => {
  map.setView([36.5, 137.5], 7, { animate: true });
});

// 路線顏色圖例
function renderRouteLegend() {
  const el = document.getElementById('route-legend');
  if (!el) return;
  el.innerHTML = Object.entries(DAY_COLORS).map(([date, color]) => {
    const label = DAY_SHORT[date] || date;
    return `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div><span>${label}</span></div>`;
  }).join('');
}

// 手機地圖切換按鈕
document.getElementById('btn-map-toggle')?.addEventListener('click', function() {
  const mapPanel  = document.getElementById('map-panel');
  const itiPanel  = document.getElementById('itinerary-panel');
  const isMapMode = mapPanel?.classList.contains('mobile-active');
  if (isMapMode) {
    mapPanel?.classList.remove('mobile-active');
    itiPanel?.classList.add('mobile-active');
    this.classList.remove('active');
  } else {
    itiPanel?.classList.remove('mobile-active');
    mapPanel?.classList.add('mobile-active');
    this.classList.add('active');
    setTimeout(() => map.invalidateSize(), 60);
  }
});

// ════════════════════════════════════════════
//  FEATURE 2: TIMELINE VIEW
// ════════════════════════════════════════════
let timelineMode = false;

function renderTimelineView() {
  const HOUR_START = 8;
  const HOUR_END   = 22;
  const HOUR_H     = 48; // px per hour
  const TOTAL_H    = (HOUR_END - HOUR_START) * HOUR_H;

  const container = document.getElementById('timeline-view');
  container.innerHTML = Object.entries(itinerary).map(([date, day]) => {
    const places = day.places || [];
    const color  = DAY_COLORS[date] || '#888';

    // 分類：有時間 vs 無時間
    const timed   = places.filter(p => p.time && /^\d{1,2}:\d{2}$/.test(p.time));
    const noTime  = places.filter(p => !p.time || !/^\d{1,2}:\d{2}$/.test(p.time));

    // 時間格線
    const rulerSlots = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
      const h = HOUR_START + i;
      return `<div class="tl-ruler-slot"><span class="tl-ruler-label">${String(h).padStart(2,'0')}:00</span></div>`;
    }).join('');

    // 背景格線（含最後一條）
    const gridLines = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
      return `<div class="tl-grid-line" style="top:${i * HOUR_H}px"></div>`;
    }).join('');

    // 事件（絕對定位）
    const eventsHtml = timed.map((p, idx) => {
      const [hh, mm] = p.time.split(':').map(Number);
      const topPx = (hh - HOUR_START) * HOUR_H + (mm / 60) * HOUR_H;
      const clampTop = Math.max(0, Math.min(topPx, TOTAL_H - 26));
      const emoji = p.type === 'restaurant' ? '🍽' : '🏯';
      const borderColor = color;
      const bg = color + '18';
      return `
        <div class="tl-event" style="top:${clampTop}px;border-left-color:${borderColor};background:${bg}">
          <div class="tl-event-time" style="color:${borderColor}">${escHtml(p.time)}</div>
          <div class="tl-event-name">${emoji} ${escHtml(p.name)}</div>
          ${p.description ? `<div class="tl-event-desc">${escHtml(p.description)}</div>` : ''}
        </div>`;
    }).join('');

    // 無時間行程區塊
    const noTimeHtml = noTime.length ? `
      <div class="tl-notime-section">
        <div class="tl-notime-label">⏱ 未排時間</div>
        ${noTime.map((p, i) => {
          const emoji = p.type === 'restaurant' ? '🍽' : '🏯';
          return `<div class="tl-notime-item"><span class="tl-notime-num">${i+1}</span>${emoji} ${escHtml(p.name)}</div>`;
        }).join('')}
      </div>` : '';

    const bodyHtml = places.length ? `
      <div class="tl-body">
        <div class="tl-ruler" style="height:${TOTAL_H}px">${rulerSlots}</div>
        <div class="tl-events-wrap" style="height:${TOTAL_H}px">
          ${gridLines}${eventsHtml}
        </div>
      </div>
      ${noTimeHtml}` : '<div class="tl-empty">尚無行程安排</div>';

    return `
      <div class="tl-day">
        <div class="tl-day-header" style="border-left:4px solid ${color}">
          <span class="tl-day-label" style="color:${color}">${escHtml(day.label)}</span>
          <span class="tl-day-count">${places.length} 個地點</span>
        </div>
        ${bodyHtml}
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
  const all     = document.querySelectorAll('#section-prep .prep-item input[type=checkbox]');
  const checked = document.querySelectorAll('#section-prep .prep-item input[type=checkbox]:checked');
  const pct = all.length ? Math.round(checked.length / all.length * 100) : 0;
  if (pct === 100 && !sessionStorage.getItem('prep_complete_toast')) {
    showToast('🎉 行前準備 100% 完成！');
    sessionStorage.setItem('prep_complete_toast', '1');
  }
  updatePrepRing(pct);
}

function updatePrepRing(pct) {
  if (pct === undefined) {
    const all     = document.querySelectorAll('#section-prep .prep-item input[type=checkbox]');
    const checked = document.querySelectorAll('#section-prep .prep-item input[type=checkbox]:checked');
    pct = all.length ? Math.round(checked.length / all.length * 100) : 0;
  }
  const circumference = 2 * Math.PI * 34; // ~213.6
  const offset = circumference * (1 - pct / 100);
  const fill = document.getElementById('prepRingFill');
  const pctEl = document.getElementById('prepPercent');
  if (fill) fill.style.strokeDashoffset = offset;
  if (pctEl) pctEl.textContent = pct + '%';
}

document.getElementById('section-prep').addEventListener('change', e => {
  if (e.target.type === 'checkbox') updatePrepProgress();
});

// ════════════════════════════════════════════
//  FEATURE 4: AI ITINERARY SUGGESTIONS
// ════════════════════════════════════════════
// ── AI 建議：每天預設中心座標
const DAY_AI_CENTERS = {
  '2026-08-03': { lat: 35.681, lng: 139.767, area: '東京' },
  '2026-08-04': { lat: 35.362, lng: 138.728, area: '富士山 河口湖' },
  '2026-08-05': { lat: 35.681, lng: 139.767, area: '東京' },
  '2026-08-06': { lat: 35.681, lng: 139.767, area: '東京' },
  '2026-08-07': { lat: 35.681, lng: 139.767, area: '東京' },
  '2026-08-08': { lat: 35.681, lng: 139.767, area: '東京' },
  '2026-08-09': { lat: 35.681, lng: 139.767, area: '東京' },
};

// 每個分類對應的 Nominatim 關鍵字
const AI_CAT_QUERIES = {
  culture:  '観光 神社 寺 博物館',
  food:     'レストラン 食堂 居酒屋',
  shopping: 'ショッピング 百貨店 市場',
  relax:    '公園 庭園',
  mix:      '観光地 名所',
};

// ════════════════════════════════════════════
//  GLOBAL AI DRAWER
// ════════════════════════════════════════════
const AI_QUICK_PROMPTS = {
  itinerary: [
    { label: '📍 附近有什麼推薦景點？',   text: '根據我今天的行程，附近有什麼值得去的景點或咖啡廳？' },
    { label: '⏱ 行程時間是否合理？',      text: '幫我檢查今天的行程時間安排是否合理，有沒有趕場的問題？' },
    { label: '🍜 幫我找餐廳',              text: '今天行程附近有什麼好吃的餐廳推薦？請給我 3 個選項。' },
    { label: '🌧 下雨備案',               text: '如果明天下雨，有什麼室內景點可以替換今天的行程？' },
  ],
  shopping: [
    { label: '💊 藥妝必買清單',            text: '日本藥妝店有哪些是台灣人必買的？幫我列出最值得買的 10 樣。' },
    { label: '🎁 伴手禮推薦',              text: '幫我推薦適合帶回台灣的日本伴手禮，預算在 ¥500 以內。' },
    { label: '🛍 哪裡購物最划算？',        text: '東京哪些地方購物最划算？免稅門檻是多少？' },
    { label: '💴 預算分配建議',            text: '7 天的東京行程，購物預算大概要抓多少才夠？' },
  ],
  prep: [
    { label: '📋 出發前還要做什麼？',      text: '出發去日本前 3 天，還有哪些重要的事情要確認？' },
    { label: '💴 換匯建議',               text: '去日本旅遊要帶多少現金？哪裡換日幣最划算？' },
    { label: '📱 網路方案',               text: '去日本旅遊，eSIM、WiFi 分享器還是當地 SIM 卡哪個最划算？' },
    { label: '🏥 日本醫療與保險',         text: '在日本生病或受傷怎麼辦？旅遊保險要買嗎？' },
  ],
  transport: [
    { label: '🚆 IC 卡還是 JR Pass？',    text: '7 天的東京行程，買 Suica/PASMO 還是 JR Pass 比較划算？' },
    { label: '✈ 羽田到市區怎麼去？',     text: '從羽田機場到淺草田原町站最快的方法是什麼？費用大概多少？' },
    { label: '🗺 河口湖怎麼去？',         text: '從東京去河口湖，搭高速巴士還是搭電車比較方便？' },
    { label: '🚌 深夜沒車怎麼辦？',       text: '東京末班車大概幾點？如果錯過了有什麼選擇？' },
  ],
  ledger: [
    { label: '💰 東京旅遊預算參考',       text: '7 天東京旅遊，餐費、交通、住宿、購物各應該預算多少？' },
    { label: '🏨 住宿費用行情',           text: '淺草田原町一帶的商務旅館，一晚大概要多少錢？' },
    { label: '🍱 每日餐費怎麼抓？',       text: '在東京旅遊，三餐加點心，一天的餐費大概要抓多少？' },
  ],
  diary: [
    { label: '✍ 幫我寫今天的旅遊日記',   text: '根據以下地點幫我寫一段旅遊日記：' },
    { label: '📸 照片說明文字',           text: '幫我為這張在日本拍的照片寫一段 Instagram 說明文字（中英文各一）' },
    { label: '🌸 旅行感想',              text: '我今天去了東京，幫我用詩意的方式描述這個城市的感受。' },
  ],
};

function renderAIQuickPrompts(section) {
  const prompts = AI_QUICK_PROMPTS[section] || AI_QUICK_PROMPTS['itinerary'];
  const container = document.getElementById('aiQuickPrompts');
  if (!container) return;
  container.innerHTML = prompts.map(p =>
    `<button class="ai-quick-btn" data-text="${encodeURIComponent(p.text)}">${p.label}</button>`
  ).join('');
  container.querySelectorAll('.ai-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = decodeURIComponent(btn.dataset.text);
      document.getElementById('aiInput').value = text;
      document.getElementById('aiInput').focus();
    });
  });
}

function getTodayDayKey() {
  return Object.keys(DAY_SHORT).find(k =>
    new Date(k).toDateString() === new Date().toDateString()
  ) || Object.keys(DAY_SHORT)[0];
}

function closeAIDrawer() {
  const drawer = document.getElementById('aiDrawer');
  drawer.classList.remove('ai-drawer-open');
  setTimeout(() => { drawer.style.display = 'none'; }, 300);
}

document.getElementById('aiCloseBtn').addEventListener('click', closeAIDrawer);

document.getElementById('aiSendBtn').addEventListener('click', sendAIMessage);
document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); }
});

async function sendAIMessage() {
  const input = document.getElementById('aiInput');
  const text  = input.value.trim();
  if (!text) return;
  appendAIMessage(text, 'user');
  input.value = '';
  const ctx = buildAIContext();
  const fullPrompt = ctx + '\n\n用戶問題：' + text;
  appendAIMessage('⏳ 思考中...', 'bot', 'thinking');
  try {
    const reply = await callAIEndpoint(fullPrompt);
    removeThinkingMessage();
    appendAIMessage(reply, 'bot');
  } catch {
    removeThinkingMessage();
    appendAIMessage('❌ 抱歉，AI 暫時無法回應，請稍後再試。', 'bot');
  }
}

function buildAIContext() {
  const today = getTodayDayKey();
  const todayPlan = (itinerary[today]?.places || []).map(p => p.name).join('、') || '尚未安排';
  const base = `你是一個專業的日本旅遊助手，正在協助用戶規劃 2026年8月3日至8月9日的東京旅行。旅客：野狼 & 美珊（台灣旅客）。住宿：淺草田原町站前APA飯店。`;
  const sectionContext = {
    itinerary:  `當前查看的是行程規劃頁面。今天（${today}）的行程：${todayPlan}。`,
    shopping:   `當前查看的是購物清單頁面。已加入清單的商品：${shopItems.map(s => s.name).join('、')}。`,
    prep:       `當前查看的是行前準備頁面。`,
    transport:  `當前查看的是交通查詢頁面。`,
    ledger:     `當前查看的是旅費記帳頁面。目前記錄的支出筆數：${expenses.length} 筆。`,
    diary:      `當前查看的是旅遊日記頁面。`,
  };
  return base + '\n' + (sectionContext[activeSection] || '') + '\n請用繁體中文回答。回答要簡潔實用。';
}

async function callAIEndpoint(prompt) {
  const res = await fetch('/api/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ask', question: prompt, places: [] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.answer || '';
}

function appendAIMessage(text, role, id = '') {
  const messages = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  if (id) div.id = id;
  div.innerHTML = role === 'bot' ? (window.marked ? marked.parse(text) : text) : escHtml(text);
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeThinkingMessage() {
  document.getElementById('thinking')?.remove();
}

// Currency converter change handler
document.getElementById('twd2jpy')?.addEventListener('input', updateCurrencyConvert);

document.getElementById('btn-export').addEventListener('click', async () => {
  const btn = document.getElementById('btn-export');
  btn.textContent = '⏳ 儲存中…';
  btn.disabled = true;
  try {
    await saveItinerary();
    btn.textContent = '✅ 已儲存';
    setTimeout(() => { btn.textContent = '⬇ 儲存'; btn.disabled = false; }, 2000);
  } catch(e) {
    alert('儲存失敗：' + e.message);
    btn.textContent = '⬇ 儲存';
    btn.disabled = false;
  }
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
    const rect = document.getElementById('section-itinerary').getBoundingClientRect();
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
        saveExpenses(); renderExpenseList(); renderSettle(); drawSpendingChart(expenses); updateCurrencyConvert();
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
  saveExpenses(); renderExpenseList(); drawSpendingChart(expenses); updateCurrencyConvert();
  document.getElementById('exp-desc').value=''; document.getElementById('exp-amount').value='';
  showToast('已加入記帳 ✓');
}
function openExpenseModal() {
  switchTab('ledger');
  showFloatingButtons(true);
}
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
  document.querySelectorAll('#section-prep .prep-item input[type="checkbox"]').forEach(cb => {
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
          <input type="number" class="shop-price-input" placeholder="¥" min="0" step="100" value="${item.price||''}" style="width:68px;font-size:11px;padding:2px 5px;border:1px solid var(--border);border-radius:8px;background:#fff;outline:none">
          <button class="shop-item-del">×</button>
        </div>`).join('')}`;

    block.querySelectorAll('.shop-item').forEach(row => {
      const id = parseInt(row.dataset.id);
      row.querySelector('input[type=checkbox]').addEventListener('change', e => {
        const it = shopItems.find(i=>i.id===id);
        if (it) { it.bought = e.target.checked; saveShopItems(); renderShoppingList(); }
      });
      row.querySelector('.shop-price-input').addEventListener('input', e => {
        const it = shopItems.find(i=>i.id===id);
        if (it) { it.price = parseFloat(e.target.value) || 0; saveShopItems(); recalcShopBudget(); }
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
  recalcShopBudget();
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
  document.getElementById('itinerary-panel')?.classList.add('mobile-active');
  nav.querySelectorAll('.mnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      nav.querySelectorAll('.mnav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTab(panel);
      showFloatingButtons(true);
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
    // ── 橫濱・湘南 ──
    { zh:'橫濱',   en:'yokohama',         ja:'横浜' },
    { zh:'關內',   en:'kannai',           ja:'関内' },
    { zh:'桜木町', en:'sakuragicho',      ja:'桜木町' },
    { zh:'石川町', en:'ishikawacho',      ja:'石川町' },
    { zh:'元町・中華街',en:'motomachi',   ja:'元町・中華街' },
    { zh:'新横浜', en:'shinyokohama',     ja:'新横浜' },
    { zh:'港未來', en:'minatomirai',      ja:'みなとみらい' },
    { zh:'藤澤',   en:'fujisawa',         ja:'藤沢' },
    { zh:'辻堂',   en:'tsujido',          ja:'辻堂' },
    { zh:'茅崎',   en:'chigasaki',        ja:'茅ヶ崎' },
    { zh:'平塚',   en:'hiratsuka',        ja:'平塚' },
    { zh:'二宮',   en:'ninomiya',         ja:'二宮' },
    { zh:'國府津', en:'kozu',             ja:'国府津' },
    { zh:'小田原', en:'odawara',          ja:'小田原' },
    { zh:'江之島', en:'enoshima',         ja:'江ノ島' },
    { zh:'鵠沼海岸',en:'kugenuma',        ja:'鵠沼海岸' },
    // ── 鎌倉・逗子 ──
    { zh:'鎌倉',   en:'kamakura',         ja:'鎌倉' },
    { zh:'北鎌倉', en:'kitakamakura',     ja:'北鎌倉' },
    { zh:'長谷',   en:'hase',             ja:'長谷' },
    { zh:'極樂寺', en:'gokurakuji',       ja:'極楽寺' },
    { zh:'稻村崎', en:'inamuragasaki',    ja:'稲村ケ崎' },
    { zh:'七里濱', en:'shichirigahama',   ja:'七里ヶ浜' },
    { zh:'鎌倉高校前',en:'kamakurakokomae',ja:'鎌倉高校前' },
    { zh:'腰越',   en:'koshigoe',         ja:'腰越' },
    { zh:'逗子',   en:'zushi',            ja:'逗子' },
    // ── 成田・千葉 ──
    { zh:'成田機場第1航廈',en:'narita1',  ja:'成田空港' },
    { zh:'成田機場第2航廈',en:'narita2',  ja:'第2ビル' },
    { zh:'千葉',   en:'chiba',            ja:'千葉' },
    { zh:'柏',     en:'kashiwa',          ja:'柏' },
    { zh:'松戸',   en:'matsudo',          ja:'松戸' },
    { zh:'船橋',   en:'funabashi',        ja:'船橋' },
    { zh:'津田沼', en:'tsudanuma',        ja:'津田沼' },
    // ── 埼玉・北方向 ──
    { zh:'大宮',   en:'omiya',            ja:'大宮' },
    { zh:'浦和',   en:'urawa',            ja:'浦和' },
    { zh:'川越',   en:'kawagoe',          ja:'川越' },
    { zh:'所澤',   en:'tokorozawa',       ja:'所沢' },
    { zh:'飯能',   en:'hanno',            ja:'飯能' },
    // ── 西方向・高尾・奧多摩 ──
    { zh:'立川',   en:'tachikawa',        ja:'立川' },
    { zh:'八王子', en:'hachioji',         ja:'八王子' },
    { zh:'高尾',   en:'takao',            ja:'高尾' },
    { zh:'高尾山口',en:'takaosanguchi',   ja:'高尾山口' },
    { zh:'奧多摩', en:'okutama',          ja:'奥多摩' },
    // ── 富士山周邊 ──
    { zh:'大月',   en:'otsuki',           ja:'大月' },
    { zh:'河口湖', en:'kawaguchiko',      ja:'河口湖' },
    { zh:'富士急Highland',en:'fujiq',     ja:'富士急ハイランド' },
    { zh:'山中湖', en:'yamanakako',       ja:'山中湖' },
    { zh:'御殿場', en:'gotemba',          ja:'御殿場' },
    { zh:'三島',   en:'mishima',          ja:'三島' },
    { zh:'新富士', en:'shinfuji',         ja:'新富士' },
    { zh:'富士宮', en:'fujinomiya',       ja:'富士宮' },
    // ── 熱海・伊豆 ──
    { zh:'熱海',   en:'atami',            ja:'熱海' },
    { zh:'伊豆高原',en:'izukogen',        ja:'伊豆高原' },
    { zh:'下田',   en:'shimoda',          ja:'下田' },
    // ── 日光・宇都宮 ──
    { zh:'宇都宮', en:'utsunomiya',       ja:'宇都宮' },
    { zh:'日光',   en:'nikko',            ja:'日光' },
    { zh:'東武日光',en:'tobunikkoy',      ja:'東武日光' },
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
    const srcUrl = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(data.from)}&to=${encodeURIComponent(data.to)}`;
    const yahooBtn = `<a class="transit-yahoo-link transit-yahoo-fallback" href="${escHtml(srcUrl)}" target="_blank" rel="noopener">🔗 在 Yahoo Japan Transit 開啟</a>`;
    if (!data.routes || !data.routes.length) {
      resultsEl.innerHTML = `<div class="transit-no-result">查無路線，請確認站名是否正確<br>${yahooBtn}</div>`;
      resultsEl.classList.remove('hidden');
      return;
    }
    resultsEl.innerHTML = `
      <div class="transit-result-header">
        <span class="transit-result-title">${escHtml(data.from)} → ${escHtml(data.to)}</span>
        <a class="transit-yahoo-link" href="${escHtml(srcUrl)}" target="_blank" rel="noopener">在 Yahoo 開啟</a>
      </div>
      ${data.routes.map(r => {
        const priColor = PRIORITY_COLOR[r.priority] || '#888';
        const priLabel = PRIORITY_LABEL[r.priority] || r.priority;
        const stops = r.stops || [];
        const stationsHtml = stops.map((st, si) => {
          const isFirst = si === 0, isLast = si === stops.length - 1;
          return `
            <div class="tr-station ${isFirst ? 'tr-dep' : isLast ? 'tr-arr' : 'tr-mid'}">
              <div class="tr-st-time">${escHtml(st.time || '')}</div>
              <div class="tr-st-dot"></div>
              <div class="tr-st-info">
                <div class="tr-st-name">${escHtml(st.name)}</div>
              </div>
            </div>`;
        }).join('');
        return `
          <div class="transit-route-card">
            <div class="tr-card-header">
              <span class="tr-route-num">路線 ${r.index}</span>
              ${r.priority ? `<span class="tr-priority" style="background:${priColor}">${priLabel}</span>` : ''}
              <span class="tr-time-range">${escHtml(r.depArr || '')}</span>
              <span class="tr-duration">${escHtml(r.duration || '')}</span>
              <span class="tr-transfers">${escHtml(r.transfers || '')}</span>
              <span class="tr-fare">${escHtml(r.fare || '')}</span>
            </div>
            <div class="tr-card-body">${stationsHtml || '<div class="transit-no-stops">詳細站點請在 Yahoo 查看</div>'}</div>
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
      const fb = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(fromEl.value)}&to=${encodeURIComponent(toEl.value)}`;
      resultsEl.innerHTML = `<div class="transit-no-result">連線失敗，請稍後再試<br><a class="transit-yahoo-fallback" href="${escHtml(fb)}" target="_blank" rel="noopener">🔗 直接在 Yahoo Japan Transit 搜尋</a></div>`;
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

function updateSyncIndicator(text) { /* removed */ }

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
//  WEATHER TRIP FORECAST (Open-Meteo)
// ════════════════════════════════════════════
async function loadTripForecast() {
  const startDate = '2026-08-03', endDate = '2026-08-09';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${startDate}&end_date=${endDate}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const bar = document.getElementById('forecastBar');
    if (!bar || !data.daily) return;
    bar.innerHTML = data.daily.time.map((date, i) => {
      const [emoji] = wmo(data.daily.weathercode[i]);
      const hi  = Math.round(data.daily.temperature_2m_max[i]);
      const lo  = Math.round(data.daily.temperature_2m_min[i]);
      const rain = data.daily.precipitation_probability_max[i];
      const dayLabel = DAY_SHORT[date] || date.slice(5);
      return `<div class="forecast-day">
        <div class="fc-date">${dayLabel}</div>
        <div class="fc-icon">${emoji}</div>
        <div class="fc-temp">${hi}°/${lo}°</div>
        <div class="fc-rain">💧${rain}%</div>
      </div>`;
    }).join('');
  } catch(e) { console.warn('Forecast fetch failed', e); }
}

// ════════════════════════════════════════════
//  SPENDING CHART + CURRENCY CONVERTER
// ════════════════════════════════════════════
function drawSpendingChart(expArr) {
  const canvas = document.getElementById('spendingChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const totals = {};
  (expArr || []).forEach(e => { totals[e.cat] = (totals[e.cat] || 0) + e.amount; });
  const entries = Object.entries(totals).filter(([, v]) => v > 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!entries.length) return;
  const colors = ['#E74C3C','#F39C12','#27AE60','#2980B9','#8E44AD','#16A085','#E67E22'];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let startAngle = -Math.PI / 2;
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 10;
  entries.forEach(([cat, val], i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    const mid = startAngle + slice / 2;
    const lx = cx + (r * 0.65) * Math.cos(mid);
    const ly = cy + (r * 0.65) * Math.sin(mid);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(CAT_EMOJI[cat] || cat, lx, ly + 4);
    startAngle += slice;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.42, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card') || '#fff';
  ctx.fill();
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¥' + total.toLocaleString(), cx, cy + 5);
}

function updateCurrencyConvert() {
  const rate = parseFloat(document.getElementById('twd2jpy')?.value) || 4.55;
  const totalJPY = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const totalTWD = Math.round(totalJPY / rate);
  const el = document.getElementById('totalTWD');
  if (el) el.textContent = `≈ NT$ ${totalTWD.toLocaleString()}`;
}

// ════════════════════════════════════════════
//  SHOPPING: SEARCH + BUDGET
// ════════════════════════════════════════════
document.getElementById('shopSearch')?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('.shop-item').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

function recalcShopBudget() {
  let total = 0, spent = 0;
  document.querySelectorAll('.shop-item').forEach(item => {
    const price  = parseFloat(item.querySelector('.shop-price-input')?.value) || 0;
    const checked = item.querySelector('input[type=checkbox]')?.checked;
    total += price;
    if (checked) spent += price;
  });
  const estEl = document.getElementById('shopTotalEstimate');
  const spentEl = document.getElementById('shopTotalSpent');
  if (estEl) estEl.textContent = '¥ ' + total.toLocaleString();
  if (spentEl) spentEl.textContent = '¥ ' + spent.toLocaleString();
}

// ════════════════════════════════════════════
//  TRANSPORT: FILL FROM ITINERARY
// ════════════════════════════════════════════
document.getElementById('fillFromItinerary')?.addEventListener('click', () => {
  const todayKey = Object.keys(DAY_SHORT).find(k => {
    return new Date(k).toDateString() === new Date().toDateString();
  }) || Object.keys(DAY_SHORT)[0];
  const firstActivity = itinerary[todayKey]?.places?.[0];
  if (firstActivity?.name) {
    const fromEl = document.getElementById('transit-from');
    if (fromEl) { fromEl.value = firstActivity.name; showToast('已自動填入出發地 ✓'); }
  } else {
    showToast('今日行程尚無地點');
  }
});

// ════════════════════════════════════════════
//  DIARY
// ════════════════════════════════════════════
const DIARY_DAYS = ['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07','2026-08-08','2026-08-09'];
let activeDiaryDay = DIARY_DAYS[0];

function renderDiary() {
  const hub = document.getElementById('diary-landing');
  const editor = document.getElementById('diary-editor');
  if (!hub || !editor) return;
  hub.style.display = 'flex';
  editor.style.display = 'none';
  const diaryData = JSON.parse(localStorage.getItem('diaryData') || '{}');
  hub.innerHTML = `
    <div class="diary-hub-header">
      <div class="diary-hub-title">📷 旅遊日記</div>
      <div class="diary-hub-sub">記錄每天的精彩時刻</div>
    </div>
    <div class="diary-day-cards">
      ${DIARY_DAYS.map(d => {
        const day = diaryData[d] || {};
        const hasContent = day.text || (day.photos && day.photos.length > 0);
        const photoCount = (day.photos || []).length;
        return `
          <button class="diary-day-card${hasContent ? ' has-content' : ''}" data-day="${d}">
            <span class="diary-card-date">${DAY_SHORT[d] || d}</span>
            <span class="diary-card-title">${escHtml(day.title || (hasContent ? '已記錄' : '尚無記錄'))}</span>
            ${photoCount > 0 ? `<span class="diary-card-photos">📷 ${photoCount} 張</span>` : '<span class="diary-card-photos">點擊記錄</span>'}
          </button>`;
      }).join('')}
    </div>`;
  hub.querySelectorAll('.diary-day-card').forEach(btn => {
    btn.addEventListener('click', () => openDiaryEditor(btn.dataset.day));
  });
}

function openDiaryEditor(day) {
  activeDiaryDay = day;
  const hub = document.getElementById('diary-landing');
  const editor = document.getElementById('diary-editor');
  if (!hub || !editor) return;
  hub.style.display = 'none';
  editor.style.display = 'flex';
  const label = document.getElementById('diaryEditorDayLabel');
  if (label) label.textContent = DAY_SHORT[day] || day;
  const diaryData = JSON.parse(localStorage.getItem('diaryData') || '{}');
  const dayData = diaryData[day] || { title: '', text: '', photos: [] };
  const titleEl = document.getElementById('diaryTitle');
  const textEl = document.getElementById('diaryText');
  if (titleEl) titleEl.value = dayData.title || '';
  if (textEl) textEl.value = dayData.text || '';
  renderDiaryPhotos(dayData.photos || []);
  // 重新綁定 save 按鈕（移除舊 listener）
  const saveBtn = document.getElementById('saveDiary');
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  newSaveBtn.addEventListener('click', () => saveDiaryDay());
  // 重新綁定照片 input
  const photoInput = document.getElementById('photoInput');
  const newPhotoInput = photoInput.cloneNode(true);
  photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
  newPhotoInput.id = 'photoInput';
  document.querySelector('label[for="photoInput"]').htmlFor = 'photoInput';
  newPhotoInput.addEventListener('change', e => {
    [...e.target.files].forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => addDiaryPhoto(ev.target.result);
      reader.readAsDataURL(file);
    });
  });
}

function saveDiaryDay() {
  const title = (document.getElementById('diaryTitle') || {}).value || '';
  const text = (document.getElementById('diaryText') || {}).value || '';
  const data = JSON.parse(localStorage.getItem('diaryData') || '{}');
  if (!data[activeDiaryDay]) data[activeDiaryDay] = { title: '', text: '', photos: [] };
  data[activeDiaryDay].title = title;
  data[activeDiaryDay].text = text;
  localStorage.setItem('diaryData', JSON.stringify(data));
  const btn = document.getElementById('saveDiary');
  if (btn) { btn.textContent = '✅ 已儲存'; setTimeout(() => btn.textContent = '💾 儲存日記', 1500); }
}

// 日記返回按鈕
document.getElementById('diary-back-btn')?.addEventListener('click', () => renderDiary());

function addDiaryPhoto(base64) {
  const data = JSON.parse(localStorage.getItem('diaryData') || '{}');
  if (!data[activeDiaryDay]) data[activeDiaryDay] = { title: '', text: '', photos: [] };
  data[activeDiaryDay].photos.push(base64);
  localStorage.setItem('diaryData', JSON.stringify(data));
  renderDiaryPhotos(data[activeDiaryDay].photos);
}

function renderDiaryPhotos(photos) {
  const grid = document.getElementById('diaryPhotoGrid');
  if (!grid) return;
  grid.innerHTML = (photos || []).map((src, i) => `
    <div class="diary-photo-item">
      <img src="${src}" alt="照片 ${i+1}">
      <button class="photo-delete" data-idx="${i}">✕</button>
    </div>`).join('');
  grid.querySelectorAll('.photo-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = JSON.parse(localStorage.getItem('diaryData') || '{}');
      if (data[activeDiaryDay]) {
        data[activeDiaryDay].photos.splice(+btn.dataset.idx, 1);
        localStorage.setItem('diaryData', JSON.stringify(data));
        renderDiaryPhotos(data[activeDiaryDay].photos);
      }
    });
  });
}

// ════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════
(async () => {
  try { await loadItinerary(); } catch(e) { console.error('[init] loadItinerary:', e); ensureDays(); ensureFlights(); renderItinerary(); }
  loadTripForecast();
  try { await loadPlaces(); } catch(e) { console.error('[init] loadPlaces:', e); }
  try { await loadExpenses(); } catch(e) {}
  initPrepChecklists();
  renderShoppingList();
  updateCountdown();
  updatePrepRing();
  try { await syncPull(); } catch(e) {}
})();

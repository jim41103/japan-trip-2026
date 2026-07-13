// ════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════
const HOTEL = {
  name: '淺草田原町站前APA飯店',
  description: '住宿', lat: 35.710269, lng: 139.7901016, type: 'hotel',
  ftid: '0x60188ebec487f909:0x49b8ac644b467e30',
  googleMapsUrl: 'https://www.google.com/maps/place/APA+Hotel+Asakusa+Tawaramachi+Ekimae/@35.710269,139.7901016,17z',
  address: '〒111-0031 東京都台東区千束1-6-3',
  phone: '+81-3-5806-1611',
  checkIn: '15:00',
  checkOut: '10:00',
  wifi: '館內免費 Wi-Fi（房間內見指示卡）',
  station: '銀座線「田原町駅」步行 4 分鐘',
  confirmationCode: '',
};
const HOTEL_0808 = {
  name: 'HOTEL FUJiTORiiGATE',
  description: '住宿', lat: 35.4828938, lng: 138.7967342, type: 'hotel',
  ftid: '0x60196153e8ecd82d:0x6430cb81f7c21d92',
  googleMapsUrl: 'https://maps.app.goo.gl/xDJqon45c7W1vL2HA',
  address: '〒403-0005 山梨県富士吉田市上吉田2-6-18',
  phone: '+81-555-72-8880',
  checkIn: '15:00',
  checkOut: '11:00',
  wifi: '館內免費 Wi-Fi',
  station: '富士急行「河口湖駅」搭接駁車 5 分鐘',
  confirmationCode: '',
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

// ── 急難聯絡 ──────────────────────────────────────────────────────────────────
const EMERGENCY = [
  { emoji:'🚓', label:'警察',               tel:'110',              desc:'犯罪・緊急事件' },
  { emoji:'🚑', label:'救護車・消防',        tel:'119',              desc:'傷病・火災' },
  { emoji:'📞', label:'旅遊諮詢熱線',        tel:'050-3816-2787',    desc:'觀光廳中文服務（免費）' },
  { emoji:'🇹🇼', label:'台灣駐日辦事處（東京）', tel:'+81-3-3280-7811', desc:'護照遺失・緊急領事協助' },
  { emoji:'🔵', label:'警察英語諮詢',        tel:'#9110',             desc:'非緊急・英語警察諮詢' },
];

// ── 常用日語 ──────────────────────────────────────────────────────────────────
const JP_PHRASES = [
  { cat:'basic',     jp:'すみません',                       rom:'Sumimasen',                           zh:'不好意思 / 麻煩您' },
  { cat:'basic',     jp:'ありがとうございます',              rom:'Arigatou gozaimasu',                  zh:'謝謝' },
  { cat:'basic',     jp:'わかりません',                      rom:'Wakarimasen',                         zh:'我不懂' },
  { cat:'basic',     jp:'英語はわかりますか？',              rom:'Eigo wa wakarimasu ka?',               zh:'您會說英語嗎？' },
  { cat:'food',      jp:'これをください',                    rom:'Kore o kudasai',                      zh:'請給我這個' },
  { cat:'food',      jp:'いくらですか？',                    rom:'Ikura desu ka?',                      zh:'多少錢？' },
  { cat:'food',      jp:'カードは使えますか？',              rom:'Kaado wa tsukaemasu ka?',              zh:'可以刷卡嗎？' },
  { cat:'food',      jp:'袋は要りません',                    rom:'Fukuro wa irimasen',                  zh:'不需要袋子（環保）' },
  { cat:'food',      jp:'アレルギーがあります',              rom:'Arerugii ga arimasu',                 zh:'我有過敏' },
  { cat:'transport', jp:'トイレはどこですか？',              rom:'Toire wa doko desu ka?',               zh:'廁所在哪裡？' },
  { cat:'transport', jp:'〇〇はどこですか？',                rom:'〇〇 wa doko desu ka?',                zh:'〇〇在哪裡？' },
  { cat:'transport', jp:'写真を撮ってもいいですか？',        rom:'Shashin totte mo ii desu ka?',         zh:'可以拍照嗎？' },
  { cat:'emergency', jp:'病院に連れて行ってください',        rom:'Byouin ni tsurete itte kudasai',       zh:'請帶我去醫院' },
  { cat:'emergency', jp:'パスポートをなくしました',          rom:'Pasupooto o nakushimashita',           zh:'我遺失了護照' },
  { cat:'emergency', jp:'警察を呼んでください',              rom:'Keisatsu o yonde kudasai',             zh:'請幫我叫警察' },
  { cat:'emergency', jp:'財布を盗まれました',                rom:'Saifu o nusumaremashita',              zh:'我的錢包被偷了' },
];

// ════════════════════════════════════════════
//  LOCALSTORAGE SCHEMA VERSION（改資料結構時遞增）
// ════════════════════════════════════════════
const SCHEMA_VERSION = 2;
(function migrateSchema() {
  const stored = parseInt(localStorage.getItem('__schema_version') || '0', 10);
  if (stored === SCHEMA_VERSION) return;
  try {
    // v1 → v2 migration example（未來加 migration 邏輯）
    // if (stored < 2) { ... }

    // 驗證關鍵 key 的 JSON 完整性（壞掉就重置）
    ['shopItems', 'diaryData', 'expenses'].forEach(k => {
      const v = localStorage.getItem(k);
      if (v) { try { JSON.parse(v); } catch { localStorage.removeItem(k); console.warn(`已重置損毀的 ${k}`); } }
    });
    localStorage.setItem('__schema_version', String(SCHEMA_VERSION));
  } catch (e) { console.error('schema migration failed:', e); }
})();

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let allPlaces = [], filteredPlaces = [], itinerary = {}, notionPages = [], expenses = [];
let markers = {}, activeFilter = 'all', activeNotionTab = 0;
let shopItems = (() => {
  try {
    const raw = localStorage.getItem('shopItems');
    return raw ? JSON.parse(raw) : defaultShopItems();
  } catch { return defaultShopItems(); }
})();

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
  document.getElementById('floatEmergencyBtn').style.display = 'flex';
  const cd = document.getElementById('landingCountdown');
  const daysLeft = Math.ceil((new Date('2026-08-03') - new Date()) / 86400000);
  if (cd) cd.textContent = daysLeft > 0 ? `✈ 還有 ${daysLeft} 天出發！` : '🎉 旅程進行中！';
  loadWeatherCardPreview();
  document.querySelectorAll('.landing-card').forEach(card => {
    if (!card.dataset.tab) return; // 沒有 tab 的卡片（如天氣）保留原本 onclick
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
  }
  if (tabName === 'shopping') renderShoppingList();
  if (tabName === 'ledger') {
    syncPaidByOptions(); renderExpenseList(); renderSettle();
    drawSpendingChart(expenses); drawDailyChart(expenses); updateCurrencyConvert();
    fetchSheetMeta(true); // 切到記帳頁：使用者要看最新結清狀態，繞過快取
  }
  if (tabName === 'phrases') renderPhrases();
  if (tabName === 'prep') updatePrepRing();
  if (tabName === 'diary') renderDiary();
  // 如 AI 抽屜開著，同步更新快捷提示
  const drawer = document.getElementById('aiDrawer');
  if (drawer && drawer.style.display !== 'none') renderAIQuickPrompts(tabName);
}

function showFloatingButtons(show) {
  document.getElementById('floatAIBtn').style.display  = show ? 'flex' : 'none';
  document.getElementById('homeBtn').style.display     = show ? 'flex' : 'none';
  // 緊急按鈕始終可見（splash 結束後顯示）
  document.getElementById('floatEmergencyBtn').style.display = 'flex';
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
  navigator.serviceWorker.register('/sw.js').then(reg => {
    // 主動檢查新版本，不完全依賴瀏覽器自己的排程檢查（那個間隔可能長達數小時）
    reg.update();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });
  }).catch(() => {});

  // 偵測到新版 SW 接管後自動重新整理一次，避免使用者停留在舊分頁看到過期資料
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });
}

// 離線狀態橫幅
function updateOnlineStatus() {
  document.getElementById('offline-banner')?.classList.toggle('visible', !navigator.onLine);
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

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

// ════════════════════════════════════════════
//  短 TTL 快取（天氣/匯率等唯讀外部 API，避免切頁/重整就重打）
// ════════════════════════════════════════════
// 快取鍵一律用 cache_ 前綴，刻意避開 prep_（shouldSyncKey 的前綴同步範圍），
// 這些是唯讀外部資料、不需要跨裝置同步，落入 prep_ 前綴會被誤推上雲端
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 分鐘
// 讀快取：在 TTL 內回傳 {data, stale:false}；過期回傳 {data:null, stale:true}（data 仍給呼叫端當作失敗時的備援）
function readCache(key) {
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (!raw) return { data: null, stale: true };
    const { data, ts } = JSON.parse(raw);
    return { data, stale: (Date.now() - ts) > CACHE_TTL_MS };
  } catch { return { data: null, stale: true }; }
}
function writeCache(key, data) {
  try { localStorage.setItem(`cache_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
}
// 帶快取的 fetch：TTL 內直接用快取；過期才呼叫 fetcher，fetcher 失敗時退回舊快取（stale-while-error）
// force=true 時繞過 TTL 判斷、一律重打（供「使用者主動要最新資料」的呼叫點使用，例如切頁/儲存後），
// 成功後仍 writeCache，讓其他被動路徑（輪詢等）之後也能吃到這次拿到的新資料
async function fetchWithCache(key, fetcher, force = false) {
  const { data, stale } = readCache(key);
  if (!force && !stale) return data;
  try {
    const fresh = await fetcher();
    writeCache(key, fresh);
    return fresh;
  } catch (e) {
    if (data !== null) return data; // 舊快取還在，fetch 失敗時退回使用（stale-while-error）
    throw e;
  }
}

async function loadWeather() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
    );
    const { latitude: lat, longitude: lng } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=auto&forecast_days=2`;
    const data = await fetchWithCache('weather_current', () => fetch(url).then(r => r.json()));
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
      const data = await fetchWithCache('weather_tokyo_default', () => fetch(url).then(r => r.json()));
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
  crossOrigin: true, // 讓瀏覽器用 CORS 模式讀取 tile，SW 才能真正把圖存進離線快取（否則是 opaque response，res.ok 恆為 false）
}).addTo(map);

// 住宿位置：固定小房子圖示，永遠顯示（不進 marker cluster），方便一眼看出景點與住宿的相對位置
function makeHotelIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="16" fill="#2E7D32" stroke="#fff" stroke-width="2"/>
    <text x="17" y="23" text-anchor="middle" font-size="16">🏠</text>
  </svg>`;
  return L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">${svg}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17],
  });
}
[HOTEL, HOTEL_0808].forEach(h => {
  L.marker([h.lat, h.lng], { icon: makeHotelIcon(), zIndexOffset: 1000 })
    .bindPopup(`<b>🏠 住宿：${escHtml(h.name)}</b><br>${escHtml(h.address || '')}`)
    .addTo(map);
});

// ════════════════════════════════════════════
//  離線地圖預先快取：把整趟行程地點附近的 OSM 地圖磁磚先抓下來
//  （交由 sw.js 的 tile cache-first 邏輯存進 TILE_CACHE，之後離線也看得到）
// ════════════════════════════════════════════
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

async function cacheOfflineMap() {
  const btn = document.getElementById('btn-cache-map');
  const places = Object.values(itinerary).flatMap(d => d.places || []).filter(p => p.lat && p.lng);
  if (!places.length) { showToast('目前沒有可快取的地點'); return; }

  const zooms = [13, 14, 15, 16];
  const tileSet = new Set();
  places.forEach(p => {
    zooms.forEach(z => {
      const { x, y } = latLngToTile(p.lat, p.lng, z);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        tileSet.add(`${z}/${x + dx}/${y + dy}`);
      }
    });
  });
  const subdomains = ['a', 'b', 'c'];
  const urls = [...tileSet].map(t => {
    const [z, x, y] = t.split('/');
    const s = subdomains[Math.floor(Math.random() * subdomains.length)];
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  });

  if (btn) { btn.disabled = true; btn.textContent = `📥 下載中 0/${urls.length}`; }
  let done = 0;
  const BATCH = 6; // 避免同時發太多請求塞爆連線
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(urls.slice(i, i + BATCH).map(u => fetch(u).catch(() => {})));
    done = Math.min(i + BATCH, urls.length);
    if (btn) btn.textContent = `📥 下載中 ${done}/${urls.length}`;
  }
  if (btn) { btn.disabled = false; btn.textContent = '📥 快取全程地圖'; }
  showToast(`✅ 地圖快取完成，共 ${urls.length} 張磁磚`);
}

document.getElementById('btn-cache-map')?.addEventListener('click', cacheOfflineMap);

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

// 取地點座標：優先用 places.json（allPlaces）依名稱查找的權威座標，
// 找不到再 fallback 用行程項目內嵌的座標（reconcile 後兩者通常一致）。
function getPlaceCoords(place) {
  if (!place) return null;
  const master = allPlaces.find(p => p.name === place.name);
  if (master && master.lat && master.lng) return { lat: master.lat, lng: master.lng };
  if (place.lat && place.lng) return { lat: place.lat, lng: place.lng };
  return null;
}

// 從 googleMapsUrl 抽取 FTID（形如 0x60188957de0e5009:0xeec96412fe192abc）。
const FTID_RE = /0x[0-9a-f]+:0x[0-9a-f]+/;
function extractFtid(url) {
  if (!url) return null;
  const m = url.match(FTID_RE);
  return m ? m[0] : null;
}

// 取地點座標＋FTID＋權威名稱：優先用 places.json（allPlaces）依名稱查找的條目，
// 找不到再 fallback 用傳入物件自帶的 ftid / googleMapsUrl / 座標。
function getPlaceNavInfo(place) {
  if (!place) return null;
  const master = allPlaces.find(p => p.name === place.name);
  if (master && master.lat && master.lng) {
    return {
      name: master.name,
      lat: master.lat,
      lng: master.lng,
      ftid: extractFtid(master.googleMapsUrl),
    };
  }
  if (place.lat && place.lng) {
    return {
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      ftid: place.ftid || extractFtid(place.googleMapsUrl),
    };
  }
  return null;
}

// 產生 Google Maps 大眾運輸導航深度連結（origin → destination）。
// 兩端都有 FTID 時組 FTID+座標深度連結（避免座標被吸附到鄰近 POI）；
// 任一端缺 FTID 則 fallback 現行純座標 api=1 格式；任一端缺座標則回傳 null。
function transitDirectionsUrl(origin, dest) {
  const o = getPlaceNavInfo(origin);
  const d = getPlaceNavInfo(dest);
  if (!o || !d) return null;

  if (o.ftid && d.ftid) {
    const oName = encodeURIComponent(o.name);
    const dName = encodeURIComponent(d.name);
    return `https://www.google.com/maps/dir/${oName}/${dName}/data=!4m14!4m13`
      + `!1m5!1m1!1s${o.ftid}!2m2!1d${o.lng}!2d${o.lat}`
      + `!1m5!1m1!1s${d.ftid}!2m2!1d${d.lng}!2d${d.lat}!3e3`;
  }

  const originParam = encodeURIComponent(`${o.lat},${o.lng}`);
  const destParam    = encodeURIComponent(`${d.lat},${d.lng}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=transit`;
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

let markerCluster = null;
function renderMarkers() {
  if (markerCluster) map.removeLayer(markerCluster);
  markers = {};
  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 45,
    disableClusteringAtZoom: 15,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    chunkedLoading: true,
  });
  filteredPlaces.forEach((place, idx) => {
    const marker = L.marker([place.lat, place.lng], { icon: makeIcon(place.type) })
      .bindPopup(buildPopupHTML(place, idx), { maxWidth: 270 });
    marker.on('click', () => highlightListItem(idx));
    markers[idx] = marker;
    markerCluster.addLayer(marker);
  });
  map.addLayer(markerCluster);
  if (filteredPlaces.length > 0) {
    map.fitBounds(markerCluster.getBounds().pad(0.1));
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
      <a class="place-map-link" href="${googleMapsUrl(place)}" target="_blank" rel="noopener" title="Google Maps" onclick="event.stopPropagation()">G</a>`;
    li.addEventListener('click', e => {
      if (e.target.closest('.place-map-link')) return;
      flyToPlace(idx);
    });
    ul.appendChild(li);
  });
  initPlaceListDrag();
}

function initPlaceListDrag() {
  const ul = document.getElementById('places-list');
  if (!ul) return;
  if (ul._sortable) { ul._sortable.destroy(); }
  ul._sortable = Sortable.create(ul, {
    group: { name: 'places', pull: 'clone', put: false },
    sort: false,
    animation: 120,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
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
  markerCluster?.zoomToShowLayer(markers[idx], () => markers[idx]?.openPopup());
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

// ════════════════════════════════════════════
//  HOTEL DETAILS MODAL
// ════════════════════════════════════════════
function showHotelDetails(key) {
  const h = key === '0808' ? HOTEL_0808 : HOTEL;
  const savedCode = localStorage.getItem(`hotel_code_${key}`) || '';
  const savedWifiPw = localStorage.getItem(`hotel_wifi_${key}`) || '';
  const modal = document.getElementById('hotelModal');
  const body = document.getElementById('hotelModalBody');
  body.innerHTML = `
    <div class="hotel-detail-header">
      <span class="hotel-detail-icon">🏨</span>
      <div>
        <div class="hotel-detail-name">${escHtml(h.name)}</div>
        <div class="hotel-detail-station">${escHtml(h.station || '')}</div>
      </div>
    </div>
    <div class="hotel-detail-grid">
      <div class="hd-row"><span class="hd-label">📍 地址</span>
        <span class="hd-value">${escHtml(h.address || '—')}</span></div>
      <div class="hd-row"><span class="hd-label">📞 電話</span>
        <a class="hd-value hd-link" href="tel:${escHtml(h.phone || '')}">${escHtml(h.phone || '—')}</a></div>
      <div class="hd-row"><span class="hd-label">🕒 Check-in</span>
        <span class="hd-value">${escHtml(h.checkIn || '—')} / Check-out ${escHtml(h.checkOut || '—')}</span></div>
      <div class="hd-row"><span class="hd-label">📶 Wi-Fi</span>
        <span class="hd-value">${escHtml(h.wifi || '—')}</span></div>
      <div class="hd-row hd-editable"><span class="hd-label">🎫 訂房代碼</span>
        <input class="hd-input" id="hd-code" placeholder="輸入訂房確認碼" value="${escHtml(savedCode)}"></div>
      <div class="hd-row hd-editable"><span class="hd-label">🔑 Wi-Fi 密碼</span>
        <input class="hd-input" id="hd-wifi" placeholder="入住後補上" value="${escHtml(savedWifiPw)}"></div>
    </div>
    <div class="hotel-detail-actions">
      <a class="hd-btn hd-btn-primary" href="${h.googleMapsUrl}" target="_blank" rel="noopener">🗺 Google Maps 導航</a>
      <a class="hd-btn hd-btn-outline" href="tel:${h.phone}">📞 撥打飯店</a>
    </div>`;
  // 儲存訂房代碼與 Wi-Fi 密碼
  body.querySelector('#hd-code').addEventListener('input', e =>
    localStorage.setItem(`hotel_code_${key}`, e.target.value));
  body.querySelector('#hd-wifi').addEventListener('input', e =>
    localStorage.setItem(`hotel_wifi_${key}`, e.target.value));
  modal.style.display = 'flex';
}
function closeHotelModal() {
  document.getElementById('hotelModal').style.display = 'none';
}

// ════════════════════════════════════════════
//  EMERGENCY PANEL
// ════════════════════════════════════════════
function showEmergencyPanel() {
  const panel = document.getElementById('emergencyPanel');
  document.getElementById('emergencyList').innerHTML = EMERGENCY.map(e =>
    `<a class="emg-item" href="tel:${e.tel}">
      <span class="emg-emoji">${e.emoji}</span>
      <div class="emg-info">
        <div class="emg-label">${escHtml(e.label)}</div>
        <div class="emg-desc">${escHtml(e.desc)}</div>
      </div>
      <span class="emg-tel">${escHtml(e.tel)}</span>
    </a>`
  ).join('');
  panel.style.display = 'flex';
  requestAnimationFrame(() => panel.classList.add('emg-open'));
}
function closeEmergencyPanel() {
  const panel = document.getElementById('emergencyPanel');
  panel.classList.remove('emg-open');
  setTimeout(() => { panel.style.display = 'none'; }, 280);
}

// ════════════════════════════════════════════
//  JAPANESE PHRASES
// ════════════════════════════════════════════
let activePhrasesCat = 'all';

function renderPhrases() {
  const container = document.getElementById('phrases-content');
  if (!container) return;
  const filtered = activePhrasesCat === 'all'
    ? JP_PHRASES
    : JP_PHRASES.filter(p => p.cat === activePhrasesCat);
  container.innerHTML = filtered.map((p, i) => `
    <div class="phrase-card" data-idx="${JP_PHRASES.indexOf(p)}">
      <div class="phrase-jp">${escHtml(p.jp)}</div>
      <div class="phrase-rom">${escHtml(p.rom)}</div>
      <div class="phrase-zh">${escHtml(p.zh)}</div>
      <span class="phrase-copy-hint">點擊複製</span>
    </div>`).join('');
  container.querySelectorAll('.phrase-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = JP_PHRASES[+card.dataset.idx];
      navigator.clipboard?.writeText(p.jp)
        .then(() => showToast('已複製：' + p.jp))
        .catch(() => showToast(p.jp));
    });
  });
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.phrase-cat-btn');
  if (!btn) return;
  document.querySelectorAll('.phrase-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePhrasesCat = btn.dataset.cat;
  renderPhrases();
});

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
// 行程裡每個地點的 lat/lng 是當初加入行程時「複製」進去的快照，
// 之後若 places.json 修正座標，行程裡的舊快照不會自動跟著更新（這是造成地圖位置對不上的根因）。
// 這裡以 places.json（allPlaces）為單一權威來源，用名稱比對把行程內嵌的座標校正回最新值。
function reconcileItineraryCoords() {
  if (!allPlaces || !allPlaces.length) return;
  const byName = new Map(allPlaces.map(p => [p.name, p]));
  Object.values(itinerary).forEach(day => {
    (day.places || []).forEach(p => {
      const master = byName.get(p.name);
      if (master && (p.lat !== master.lat || p.lng !== master.lng)) {
        p.lat = master.lat;
        p.lng = master.lng;
      }
    });
  });
}

async function loadItinerary() {
  // 立刻用靜態檔渲染，不等 sync
  const res = await fetch('/itinerary.json');
  itinerary = await res.json();
  ensureDays();
  ensureFlights();
  reconcileItineraryCoords();
  renderItinerary();
  drawRouteLines();
  renderRouteLegend();
  // 背景從 Gist 拉最新版，有差異再重新渲染
  fetch('/api/sync')
    .then(r => r.json())
    .then(syncData => {
      if (!syncData.itinerary) return;
      const remote = JSON.parse(syncData.itinerary);
      itinerary = remote;
      ensureDays();
      ensureFlights();
      reconcileItineraryCoords();
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
    const density = getDayDensity(day.places || []);
    col.innerHTML = `
      <div class="day-header" style="border-left:4px solid ${DAY_COLORS[date] || '#888'}">
        <span>${DAY_SHORT[date] || day.label}<span class="density-pill ${density.cls}">${density.label}</span></span>
        <div class="day-header-btns">
          <button class="btn-optimize" onclick="optimizeDay('${date}')" title="依地理位置自動排序當天行程順序">🗺</button>
        </div>
      </div>
      <div class="day-places" id="day-${date}"></div>
      <div class="day-notes-wrap">
        <div class="day-notes-label">📝 備注</div>
        <textarea class="day-notes" data-date="${date}" placeholder="新增當日備注…" rows="2">${escHtml(day.notes||'')}</textarea>
      </div>
      ${date === '2026-08-09' ? '' : `<div class="day-hotel-footer">
        <div class="hotel-card" onclick="showHotelDetails('${date === '2026-08-08' ? '0808' : 'apa'}')" title="點擊查看訂房資訊">
          <span class="hotel-icon">🏨</span>
          <span class="hotel-name">${escHtml(date === '2026-08-08' ? HOTEL_0808.name : HOTEL.name)}</span>
          <a class="hotel-gmaps" href="${date === '2026-08-08' ? HOTEL_0808.googleMapsUrl : HOTEL.googleMapsUrl}" target="_blank" rel="noopener" title="在 Google Maps 開啟" onclick="event.stopPropagation()">📍</a>
          <span class="hotel-badge">住宿</span>
        </div>
      </div>`}`;
    container.appendChild(col);

    const placesList = col.querySelector('.day-places');
    renderDayPlaces(placesList, date);
    Sortable.create(placesList, {
      group: { name: 'itinerary', put: ['itinerary', 'places'] },
      animation: 150,
      filter: '.iplace-locked',
      ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
      delay: 300, delayOnTouchOnly: true, touchStartThreshold: 5, draggable: '.itinerary-place',
      onAdd: function(evt) {
        if (evt.from && evt.from.id === 'places-list') {
          const idx = parseInt(evt.item.dataset.idx);
          const place = filteredPlaces[idx];
          evt.item.remove();
          if (place && itinerary[date] && !itinerary[date].places.some(p => p.name === place.name)) {
            itinerary[date].places.push({ ...place });
          }
          renderDayPlaces(placesList, date);
          drawRouteLines();
          if (timelineMode) renderTimelineView();
          markItineraryDirty();
        }
      },
      onEnd: function(evt) {
        if (!evt.from || evt.from.id !== 'places-list') {
          syncItineraryFromDOM();
          markItineraryDirty();
          // 重新渲染以刷新導航按鈕的起訖點；跨天拖曳需兩欄都刷新
          if (evt.to) renderDayPlaces(evt.to, evt.to.id.replace('day-', ''));
          if (evt.from !== evt.to) renderDayPlaces(evt.from, evt.from.id.replace('day-', ''));
        }
      },
    });

    // Notes auto-save
    col.querySelector('.day-notes').addEventListener('input', () => {
      const txt = col.querySelector(`.day-notes[data-date="${date}"]`).value;
      if (itinerary[date] && itinerary[date].notes !== txt) {
        itinerary[date].notes = txt;
        markItineraryDirty();
      }
    });

  });
  focusTodayColumn();
}

// 自動高亮並捲動至今天的欄位（旅行期間內）
function focusTodayColumn() {
  const todayKey = Object.keys(DAY_SHORT).find(k =>
    new Date(k).toDateString() === new Date().toDateString()
  );
  document.querySelectorAll('.day-column').forEach(c => c.classList.remove('today-column'));
  if (!todayKey) return;
  const col = document.querySelector(`.day-column[data-date="${todayKey}"]`);
  if (col) {
    col.classList.add('today-column');
    setTimeout(() => col.scrollIntoView({ behavior:'smooth', inline:'start', block:'nearest' }), 300);
  }
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
    container.innerHTML = '<div class="day-empty">從左側拖入地點</div>';
    return;
  }
  // 有時間的依早→晚排序，無時間排最後（保持原有相對順序）
  const timed   = places.filter(p => p.time).sort((a, b) => a.time.localeCompare(b.time));
  const untimed = places.filter(p => !p.time);
  const sorted  = [...timed, ...untimed];
  itinerary[date].places = sorted;
  sorted.forEach((place, pIdx) => {
    container.appendChild(makePlaceCard(place, date, pIdx));
  });
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
      <div class="iplace-name" style="font-size:11px;white-space:normal;line-height:1.35;text-align:left">${escHtml(place.name)}</div>
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
        <button class="iplace-nav" title="導航至此（首站從住宿出發）">🧭</button>
        <a class="iplace-gmaps" href="${googleMapsUrl(place)}" target="_blank" rel="noopener" title="Google Maps" onclick="event.stopPropagation()">📍</a>
        <button class="iplace-remove" title="移除" data-date="${date}" data-idx="${pIdx}">×</button>
      </div>
    </div>
    <div class="iplace-bottom">
      <select class="iplace-time" title="預計時間" onclick="event.stopPropagation()">
        ${buildTimeOptions(place.time || '')}
      </select>
    </div>`;
  card.querySelector('.iplace-nav').addEventListener('click', e => {
    e.stopPropagation();
    // 點擊當下才從 DOM 找「前一站」，確保拖曳調整順序後起訖點正確
    const prevCard = card.previousElementSibling;
    let origin;
    if (!prevCard || !prevCard.classList.contains('itinerary-place')) {
      // 當天第一個地點：找不到前一站卡片，改以前一晚住宿為起點
      // （8/9 前一晚住河口湖 HOTEL_0808，其餘天前一晚住 APA；
      //  8/8 早上仍從 APA 出發，故不歸入 8/9 分支）
      const hotel = date === '2026-08-09' ? HOTEL_0808 : HOTEL;
      origin = hotel;
    } else {
      origin = {
        name: prevCard.dataset.name,
        lat: parseFloat(prevCard.dataset.lat) || 0,
        lng: parseFloat(prevCard.dataset.lng) || 0,
      };
    }
    const dest = {
      name: card.dataset.name,
      lat: parseFloat(card.dataset.lat) || 0,
      lng: parseFloat(card.dataset.lng) || 0,
    };
    const url = transitDirectionsUrl(origin, dest);
    if (!url) {
      alert('此站無前一站或缺座標，無法導航');
      return;
    }
    window.open(url, '_blank', 'noopener');
  });
  card.querySelector('.iplace-time').addEventListener('change', function() {
    card.dataset.time = this.value;
    syncItineraryFromDOM();
    markItineraryDirty();
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
      container.innerHTML = '<div class="day-empty">從左側拖入地點</div>';
    } else {
      container.querySelectorAll('.day-empty').forEach(el => el.remove());
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
  markItineraryDirty();
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
  drawRouteLines();
  markItineraryDirty();
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
// 儲存狀態：'idle' | 'dirty' | 'saving' | 'saved' | 'error'
let _saveState = 'idle';
let _autoSaveTimer = null;
const AUTO_SAVE_MS = 3000;

function setSaveState(state) {
  _saveState = state;
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  const map = {
    idle:   ['☁ 已同步', 'ok'],
    dirty:  ['✏️ 未儲存…', 'dirty'],
    saving: ['⏳ 儲存中', 'saving'],
    saved:  ['✅ 已儲存', 'ok'],
    error:  ['⚠️ 儲存失敗（點擊重試）', 'error'],
  };
  const [txt, cls] = map[state] || map.idle;
  el.textContent = txt;
  el.dataset.state = cls;
  el.style.cursor = state === 'error' ? 'pointer' : 'default';
}

// 每次行程變動呼叫此函式（debounce 3 秒後自動 sync）
function markItineraryDirty() {
  setSaveState('dirty');
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => saveItinerary(true), AUTO_SAVE_MS);
}

async function saveItinerary(silent = false) {
  clearTimeout(_autoSaveTimer);
  syncItineraryFromDOM();
  Object.keys(itinerary).forEach(date => {
    const notesEl = document.querySelector(`.day-notes[data-date="${date}"]`);
    if (notesEl) itinerary[date].notes = notesEl.value;
  });
  setSaveState('saving');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/sync', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ itinerary: JSON.stringify(itinerary) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setSaveState('saved');
    if (!silent) showToast('行程已儲存 ✓');
    setTimeout(() => { if (_saveState === 'saved') setSaveState('idle'); }, 2000);
  } catch (e) {
    setSaveState('error');
    if (!silent) alert('儲存失敗：' + e.message + '\n（本機仍保有變動，之後可再試）');
  }
}

// 錯誤時點擊 indicator 重試
document.addEventListener('click', e => {
  if (e.target?.id === 'sync-indicator' && _saveState === 'error') saveItinerary();
});

// ════════════════════════════════════════════
//  FEATURE 1: ROUTE CONNECTIONS ON MAP
// ════════════════════════════════════════════
// 日系色：桜・山吹・若竹・露草・藤・茜・鼠
const DAY_COLORS = {
  '2026-08-03': '#E89DA8', // 桜色
  '2026-08-04': '#E8A33D', // 山吹色
  '2026-08-05': '#5B9F6D', // 若竹色
  '2026-08-06': '#3C7BC4', // 露草色
  '2026-08-07': '#8A6FB0', // 藤色
  '2026-08-08': '#B7282E', // 茜色
  '2026-08-09': '#3A3A3A', // 墨鼠色
};
let routePolylines = {};
let routeNumMarkers = {};
let routeLinesVisible = true;
let visibleDays = new Set(Object.keys(DAY_COLORS)); // 預設全部日期顯示，可用圖例勾選單獨開關

function drawRouteLines() {
  Object.values(routePolylines).forEach(p => map.removeLayer(p));
  Object.values(routeNumMarkers).flat().forEach(m => map.removeLayer(m));
  routePolylines = {};
  routeNumMarkers = {};
  if (!routeLinesVisible) return;

  Object.entries(itinerary).forEach(([date, day]) => {
    if (!visibleDays.has(date)) return;
    const places = (day.places || []).filter(p => p.lat && p.lng);
    if (!places.length) return;
    const color = DAY_COLORS[date] || '#888';

    if (places.length >= 2) {
      routePolylines[date] = L.polyline(places.map(p => [p.lat, p.lng]), {
        color, weight: 4, opacity: 0.85, dashArray: '10 6',
      }).addTo(map);
    }
    routeNumMarkers[date] = places.map((p, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)">${i+1}</div>`,
        iconSize:[26,26], iconAnchor:[13,13],
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

// 路線顏色圖例（可勾選單一日期，避免多天路線顏色互相重疊看不清楚）
function renderRouteLegend() {
  const el = document.getElementById('route-legend');
  if (!el) return;
  el.innerHTML = Object.entries(DAY_COLORS).map(([date, color]) => {
    const label = DAY_SHORT[date] || date;
    const checked = visibleDays.has(date) ? 'checked' : '';
    return `<label class="legend-item" title="勾選/取消顯示這天的路線">
      <input type="checkbox" class="legend-checkbox" data-date="${date}" ${checked}>
      <div class="legend-dot" style="background:${color}"></div><span>${label}</span>
    </label>`;
  }).join('') + `<button type="button" id="legend-all" class="legend-toggle-all">全選</button><button type="button" id="legend-none" class="legend-toggle-all">清空</button>`;

  el.querySelectorAll('.legend-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const d = cb.dataset.date;
      if (cb.checked) visibleDays.add(d); else visibleDays.delete(d);
      drawRouteLines();
    });
  });
  document.getElementById('legend-all')?.addEventListener('click', () => {
    visibleDays = new Set(Object.keys(DAY_COLORS));
    renderRouteLegend(); drawRouteLines();
  });
  document.getElementById('legend-none')?.addEventListener('click', () => {
    visibleDays = new Set();
    renderRouteLegend(); drawRouteLines();
  });
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
        ${date === '2026-08-09' ? '' : `<div class="tl-hotel">🏨 ${escHtml(date === '2026-08-08' ? HOTEL_0808.name : HOTEL.name)}</div>`}
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
    shopping:   `當前查看的是購物清單頁面。已加入清單的商品：${shopItems.filter(s=>!s.deleted).map(s => s.name).join('、')}。`,
    prep:       `當前查看的是行前準備頁面。`,
    transport:  `當前查看的是交通查詢頁面。`,
    ledger:     `當前查看的是旅費記帳頁面。目前記錄的支出筆數：${expenses.filter(e=>!e.deleted).length} 筆。`,
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
  syncItineraryFromDOM();
  await saveItinerary();
  showToast('行程已儲存至雲端 ✓');
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
  // 若有未送出的離線暫存，優先用本機版本，避免雲端版蓋掉還沒同步的記帳
  if (localStorage.getItem('exp-pending')) {
    try { expenses = JSON.parse(localStorage.getItem('exp-local') || '[]'); return; } catch {}
  }
  try { expenses = await (await fetch('/api/expenses')).json(); } catch { expenses = []; }
}
// 同步狀態：idle | syncing | synced | sheet-fail | fail | pending（fail=雲端都沒存到，關頁會遺失；pending=離線已暫存本機）
let expSyncState = 'idle';
function setExpSyncStatus(state, extra) {
  expSyncState = state;
  const el = document.getElementById('exp-sync-status');
  if (!el) return;
  const time = new Date().toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit' });
  const MAP = {
    syncing:      ['⏳ 同步中…請勿關閉頁面', 'sync-ing'],
    synced:       [`✅ 已同步雲端＋試算表（${time}）`, 'sync-ok'],
    'sheet-only': [`✅ 已存雲端（${time}）｜試算表同步未啟用`, 'sync-ok'],
    'sheet-fail': [`⚠️ 雲端已存（${time}），試算表同步失敗 — 點此重試`, 'sync-warn'],
    fail:         ['❌ 尚未儲存！請檢查網路 — 點此重試', 'sync-fail'],
    pending:      ['📴 離線中，帳已暫存本機 — 恢復網路自動同步', 'sync-warn'],
    auth:         ['⚠️ 通行碼錯誤，尚未儲存 — 點此重新輸入', 'sync-fail'],
  };
  const [text, cls] = MAP[state] || ['', ''];
  el.textContent = text + (extra ? `（${extra}）` : '');
  el.className = `exp-sync-status ${cls}`;
  el.classList.toggle('hidden', !text);
}
// 記帳刪除改採軟刪除墓碑（deleted:true + updatedAt），比照購物清單（mergeTombstoned）：
// per-device 刪除追蹤（deletedIds 集合、push 成功後清空）無法防止「A 刪除已同步、
// B 離線期間仍持有舊副本、上線後補記帳合併」時，被刪的帳被當成本機新增聯集回去而復活，
// 還會被重新推送進 Google 試算表。改成墓碑後，刪除本身變成資料的一部分，
// 靠 updatedAt 比對自然傳播、不依賴任何一方的本機刪除記錄。
function mergeExpenses(cloud, local) {
  return mergeTombstoned(cloud, local, 'id');
}
// 儲存互斥鎖：POST 是整份覆寫，兩次 saveExpenses 並發會互蓋丟資料，進行中的後到請求排隊等前一次完成
let expSaving = false, expSaveQueued = false;
async function saveExpenses() {
  if (expSaving) { expSaveQueued = true; return; }
  expSaving = true;
  setExpSyncStatus('syncing');
  // token 每次呼叫時讀 localStorage，401 輸入新通行碼後重試才拿得到新值
  const post = async (payload) => fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'x-app-token': localStorage.getItem('exp-token') || '' },
    body: JSON.stringify(payload),
  });
  try {
    let merged = expenses;
    try {
      const cloud = await (await fetch('/api/expenses')).json();
      merged = mergeExpenses(cloud, expenses);
    } catch (_) { /* GET 失敗（離線）時退回直接送本機版，讓下面的 POST 走離線暫存流程 */ }
    let resp = await post(merged);
    if (resp.status === 401) {
      const input = prompt('請輸入記帳通行碼');
      localStorage.setItem('exp-token', input || '');
      resp = await post(merged); // 重試一次
      if (resp.status === 401) { setExpSyncStatus('auth'); return; } // 通行碼錯誤不是離線，不寫入離線暫存
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const result = await resp.json().catch(() => ({}));
    const sheet = result.sheet || {};
    // 成功後套用合併結果，並清空離線暫存（墓碑已隨 expenses 一起送出，不需另外清追蹤集合）
    expenses = merged;
    localStorage.removeItem('exp-pending');
    localStorage.removeItem('exp-local');
    renderExpenseList(); renderSettle(); drawSpendingChart(expenses); drawDailyChart(expenses); updateCurrencyConvert();
    if (sheet.status === 'ok') setExpSyncStatus('synced');
    else if (sheet.status === 'skipped') setExpSyncStatus('sheet-only');
    else setExpSyncStatus('sheet-fail', sheet.message);
    fetchSheetMeta(true); // 剛儲存成功：使用者要看最新結清狀態，繞過快取
  } catch (e) {
    console.error('記帳儲存失敗', e);
    // 離線／網路失敗：暫存本機，等 online 事件或下次載入時自動重試
    localStorage.setItem('exp-pending', '1');
    localStorage.setItem('exp-local', JSON.stringify(expenses));
    setExpSyncStatus('pending');
  } finally {
    expSaving = false;
    // 進行中有人排隊過（例如快速連加兩筆），補跑一次確保最新狀態送出
    if (expSaveQueued) { expSaveQueued = false; saveExpenses(); }
  }
}
// 網路恢復時自動重送暫存的記帳
window.addEventListener('online', () => {
  if (localStorage.getItem('exp-pending')) saveExpenses();
});
function renderExpenseList() {
  const area = document.getElementById('expense-list-area');
  if (!area) return;
  // 軟刪除墓碑（deleted:true）不顯示，但仍留在 expenses 陣列裡供合併時傳播刪除
  const visible = expenses.filter(e => !e.deleted);
  if (visible.length === 0) {
    area.innerHTML = '<div class="exp-empty">尚無記帳資料<br><small>從下方表單新增支出</small></div>';
    return;
  }
  const byDate = {};
  visible.forEach(exp => {
    if (!byDate[exp.date]) byDate[exp.date] = [];
    byDate[exp.date].push(exp);
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
          ${exp.split==='personal' ? '<span class="exp-paid-badge" style="background:#999">🙋 個人</span>' : ''}
          ${settledIds.has(String(exp.id)) ? '<span class="exp-paid-badge" style="background:#bbb">✓ 已結清</span>' : ''}
          <button class="exp-del-btn" data-id="${exp.id}">×</button>
        </div>`).join('')}`;
    group.querySelectorAll('.exp-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // 軟刪除：留下墓碑而非真的移除，讓合併時能靠 updatedAt 把刪除傳播給還沒拉到的裝置
        const id = parseInt(btn.dataset.id, 10);
        const it = expenses.find(e => e.id === id);
        if (it) { it.deleted = true; it.updatedAt = Date.now(); }
        saveExpenses(); renderExpenseList(); renderSettle(); drawSpendingChart(expenses); drawDailyChart(expenses); updateCurrencyConvert();
      });
    });
    area.appendChild(group);
  });
}
function renderSettle() {
  const content = document.getElementById('settle-content');
  if (!content) return;
  const nameA = getMemberName('a'), nameB = getMemberName('b');
  const active = expenses.filter(e=>!e.deleted); // 過濾軟刪除墓碑
  const shared = active.filter(e=>e.split!=='personal'&&!settledIds.has(String(e.id)));
  const personalA = active.filter(e=>e.split==='personal'&&e.paidBy==='a').reduce((s,e)=>s+e.amount,0);
  const personalB = active.filter(e=>e.split==='personal'&&e.paidBy==='b').reduce((s,e)=>s+e.amount,0);
  const totalA = shared.filter(e=>e.paidBy==='a').reduce((s,e)=>s+e.amount,0);
  const totalB = shared.filter(e=>e.paidBy==='b').reduce((s,e)=>s+e.amount,0);
  const total = totalA+totalB, each = total/2, diff = totalA-each, diffAbs = Math.abs(Math.round(diff));
  const byCat = {};
  shared.forEach(e => { byCat[e.cat] = (byCat[e.cat]||0) + e.amount; });
  let resultHTML = total===0
    ? `<div class="settle-result" style="border-color:#ccc;background:#f5f5f5"><div class="settle-result-desc" style="font-size:15px">尚無記帳資料</div></div>`
    : diff===0
      ? `<div class="settle-result"><div class="settle-result-label">結算結果</div><div class="settle-result-desc" style="font-size:16px">✅ 兩人花費相同，無需轉帳</div></div>`
      : `<div class="settle-result"><div class="settle-result-label">結算結果</div><div class="settle-result-amount">¥${diffAbs.toLocaleString()}</div><div class="settle-result-desc">${escHtml(diff>0?nameB:nameA)} 應付 ${escHtml(diff>0?nameA:nameB)}<br>¥${diffAbs.toLocaleString()}</div></div>`;
  content.innerHTML = `
    <div class="settle-cards">
      <div class="settle-card settle-card-a"><div class="settle-card-name">${escHtml(nameA)} 已付</div><div class="settle-card-amount">¥${totalA.toLocaleString()}</div><div class="settle-card-sub">應付 ¥${Math.round(each).toLocaleString()}${personalA?`<br>個人另花 ¥${personalA.toLocaleString()}`:''}</div></div>
      <div class="settle-card settle-card-b"><div class="settle-card-name">${escHtml(nameB)} 已付</div><div class="settle-card-amount">¥${totalB.toLocaleString()}</div><div class="settle-card-sub">應付 ¥${Math.round(each).toLocaleString()}${personalB?`<br>個人另花 ¥${personalB.toLocaleString()}`:''}</div></div>
    </div>
    ${resultHTML}
    <div class="settle-section-title">類別明細（僅計入平分項目）</div>
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
  const split=document.getElementById('exp-split').value;
  if (!desc) { showToast('請輸入說明'); return; }
  if (!amount||amount<=0) { showToast('請輸入有效金額'); return; }
  expenses.push({ id:Date.now(), date, cat, desc, amount, paidBy, split, updatedAt:Date.now() });
  saveExpenses(); renderExpenseList(); drawSpendingChart(expenses); drawDailyChart(expenses); updateCurrencyConvert();
  document.getElementById('exp-desc').value=''; document.getElementById('exp-amount').value='';
  document.getElementById('exp-split').value='shared';
  showToast('已加入記帳 ✓');
}
function openExpenseModal() {
  switchTab('ledger');
  showFloatingButtons(true);
}
document.getElementById('btn-add-exp').addEventListener('click', addExpense);
document.getElementById('exp-amount').addEventListener('keydown', e => { if(e.key==='Enter') addExpense(); });
// 同步失敗時點狀態列重試
document.getElementById('exp-sync-status').addEventListener('click', () => {
  if (expSyncState === 'auth') localStorage.removeItem('exp-token'); // 清掉錯的通行碼，重存時會再問一次
  if (expSyncState === 'fail' || expSyncState === 'sheet-fail' || expSyncState === 'auth') saveExpenses();
});
// 同步中或失敗時關頁跳警告，避免記帳遺失（pending＝已暫存本機，不算會遺失，不跳警告）
window.addEventListener('beforeunload', e => {
  if (expSyncState === 'syncing' || expSyncState === 'fail' || expSyncState === 'auth') { e.preventDefault(); e.returnValue = ''; }
});
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
  const active=expenses.filter(e=>!e.deleted); // 過濾軟刪除墓碑
  const shared=active.filter(e=>e.split!=='personal'&&!settledIds.has(String(e.id)));
  const totalA=shared.filter(e=>e.paidBy==='a').reduce((s,e)=>s+e.amount,0);
  const totalB=shared.filter(e=>e.paidBy==='b').reduce((s,e)=>s+e.amount,0);
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
  active.forEach(e => { if(!byDate[e.date]) byDate[e.date]=[]; byDate[e.date].push(e); });
  Object.keys(byDate).sort().forEach(date => {
    md+=`### ${DAY_SHORT[date]||date}\n`;
    byDate[date].forEach(e => { md+=`- ${CAT_EMOJI[e.cat]||'📦'} ${e.desc} — ¥${e.amount.toLocaleString()}（${e.paidBy==='a'?nameA:nameB} 付${e.split==='personal'?'・個人花費不拆帳':''}）\n`; });
    md+='\n';
  });
  const blob=new Blob([md],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='東京旅費結算.md'; a.click();
  URL.revokeObjectURL(url); showToast('結算已下載 ✓');
});

// 試算表回流：已結清的帳號 id 集合（renderExpenseList/renderSettle/匯出結算 皆需排除）
let settledIds = new Set();
// 拉取試算表最新匯率與結清狀態；失敗靜默略過，不影響任何現有功能
// force=true：繞過 10 分鐘快取直接打 API，供「切到記帳頁」「記帳儲存成功後」這類
// 使用者明確想看最新結清狀態的呼叫點使用；其餘被動路徑維持快取，避免頻繁重打
async function fetchSheetMeta(force = false) {
  try {
    const meta = await fetchWithCache('sheet_meta', () => fetch('/api/sheet-meta').then(r => r.json()), force);
    settledIds = new Set((meta.settledIds || []).map(String));
    const rateEl = document.getElementById('twd2jpy');
    if (rateEl && typeof meta.rate === 'number' && meta.rate > 0) {
      rateEl.value = (1 / meta.rate).toFixed(2);
      rateEl.readOnly = true;
      rateEl.title = '匯率取自試算表';
    }
    renderExpenseList(); renderSettle(); updateCurrencyConvert();
  } catch (_) { /* 唯讀輔助資訊，失敗不影響記帳主流程 */ }
}

// ════════════════════════════════════════════
//  行前準備 CHECKLIST (localStorage)
// ════════════════════════════════════════════
// 讀取使用者自訂新增的行前準備項目清單（{list, key, name, updatedAt, deleted?}[]）；
// 舊版自訂項目只存在 DOM、重整頁面或換裝置就消失，這裡改成落地 localStorage 才能真正跨裝置同步
function loadPrepCustomItems() {
  try { return JSON.parse(localStorage.getItem('prep_custom_items') || '[]'); }
  catch { return []; }
}
// 只寫本機（不觸發雲端 push），供 syncPull 合併結果落地、或內部呼叫使用
function savePrepCustomItemsLocal(items) {
  _origSetItem('prep_custom_items', JSON.stringify(items));
}
// 寫本機並推上雲端（GET→按 key 墓碑合併→POST），供使用者主動新增時呼叫
function savePrepCustomItems(items) {
  savePrepCustomItemsLocal(items);
  syncPrepCustomItemsToCloud();
}

// 儲存互斥鎖，避免快速連續新增時並發送出互蓋（比照 syncShopItemsToCloud）
let prepCustomSaving = false, prepCustomSaveQueued = false;
async function syncPrepCustomItemsToCloud() {
  if (prepCustomSaving) { prepCustomSaveQueued = true; return; }
  prepCustomSaving = true;
  try {
    let merged = loadPrepCustomItems();
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.prep_custom_items) {
        const cloud = typeof data.prep_custom_items === 'string' ? JSON.parse(data.prep_custom_items) : data.prep_custom_items;
        merged = mergeTombstoned(cloud, loadPrepCustomItems(), 'key');
      }
    } catch (_) { /* 離線時 GET 失敗，退回直接送本機版 */ }
    savePrepCustomItemsLocal(merged);
    initPrepChecklists();
    await syncPush('prep_custom_items', JSON.stringify(merged));
  } catch (_) {
    // 靜默失敗，維持本機資料，下次操作或 30 秒輪詢再試
  } finally {
    prepCustomSaving = false;
    if (prepCustomSaveQueued) { prepCustomSaveQueued = false; syncPrepCustomItemsToCloud(); }
  }
}

// 把單一自訂項目渲染成 DOM 並綁定勾選事件
function renderPrepCustomItem(listId, key, name) {
  const listEl = document.getElementById(listId);
  if (!listEl || listEl.querySelector(`input[data-key="${key}"]`)) return; // 已存在就不重複加
  const label = document.createElement('label');
  label.className = 'prep-item';
  // 自訂項目才有刪除鈕（固定的 24 個項目沒有，比照購物清單的 × 按鈕風格）
  // 沿用購物清單既有的 .shop-item-del 樣式（灰色 × 按鈕、hover 變主色），視覺風格一致、不必另外加 CSS
  label.innerHTML = `<input type="checkbox" data-key="${key}"> ${escHtml(name)} <button type="button" class="shop-item-del prep-item-del">×</button>`;
  const cb = label.querySelector('input');
  cb.checked = localStorage.getItem(`prep_${key}`) === '1';
  label.classList.toggle('checked', cb.checked);
  cb.addEventListener('change', e => {
    localStorage.setItem(`prep_${key}`, e.target.checked ? '1' : '0');
    label.classList.toggle('checked', e.target.checked);
  });
  label.querySelector('.prep-item-del').addEventListener('click', () => {
    if (confirm('刪除此項目？')) {
      // 軟刪除：留下墓碑而非真的移除，理由同購物清單（讓合併時能把刪除傳播給還沒拉到的裝置）
      const items = loadPrepCustomItems();
      const it = items.find(i => i.key === key);
      if (it) { it.deleted = true; it.updatedAt = Date.now(); }
      savePrepCustomItems(items);
      label.remove();
    }
  });
  listEl.appendChild(label);
}

function initPrepChecklists() {
  // 先把自訂項目（含跨裝置同步拉回的、排除已標記刪除的墓碑）渲染出來，
  // 才能一併被下面的 checkbox 掃描到並還原勾選狀態
  loadPrepCustomItems().filter(i => !i.deleted).forEach(({ list, key, name }) => {
    renderPrepCustomItem(`${list}-list`, key, name);
  });

  // initPrepChecklists 會被多處呼叫（新增項目、syncPull 拉回、切分頁等），
  // 每次都對全部 checkbox 重新 addEventListener 會累積重複監聽（等冪但浪費、事件會觸發多次）；
  // 用 dataset.bound 標記「已綁過」，重複呼叫時跳過，只綁一次
  document.querySelectorAll('#section-prep .prep-item input[type="checkbox"]').forEach(cb => {
    const key = cb.dataset.key;
    cb.checked = localStorage.getItem(`prep_${key}`) === '1';
    cb.closest('.prep-item').classList.toggle('checked', cb.checked);
    if (cb.dataset.bound) return;
    cb.dataset.bound = '1';
    cb.addEventListener('change', () => {
      localStorage.setItem(`prep_${key}`, cb.checked ? '1' : '0');
      cb.closest('.prep-item').classList.toggle('checked', cb.checked);
    });
  });

  document.querySelectorAll('.btn-add-prep').forEach(btn => {
    if (btn.dataset.bound) return; // 同上，避免重複呼叫時 click 監聽疊加、點一次跳多個 prompt
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const list = btn.dataset.list;
      const listId = list + '-list';
      const name = prompt('新增項目：');
      if (!name?.trim()) return;
      // key 混入隨機尾碼，避免兩人同一毫秒新增時撞號互蓋（比照 shopItems 新增 id 的做法）
      const key = list + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      // 落地存清單，讓另一裝置 syncPull 後也能重建出這個項目（不只是勾選狀態）
      const items = loadPrepCustomItems();
      items.push({ list, key, name: name.trim(), updatedAt: Date.now() });
      savePrepCustomItems(items);
      renderPrepCustomItem(listId, key, name.trim());
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
  // shopItems 不走通用 SYNC_KEYS 攔截（整包覆蓋不安全），改由下方 syncShopItemsToCloud 做「GET→按 id 合併→POST」
  localStorage.setItem('shopItems', JSON.stringify(shopItems));
  syncShopItemsToCloud();
}

// 通用「按 id 墓碑合併」：cloud/local 皆為陣列，idKey 是唯一識別欄位。
// 刪除不真的移除項目，改標 deleted:true + updatedAt（軟刪除墓碑），理由：
// 本機刪除追蹤（deletedIds 集合、push 成功後清空）無法防止「A 刪除已同步、B 本機仍持有舊副本」
// 這種情境——B 儲存時 GET 到的雲端已無該筆，但 B 本機還有，會被當成「本機新增」聯集回去，
// 讓 A 的刪除復活。改成墓碑後，刪除本身變成資料的一部分，靠 updatedAt 比對自然傳播、不會遺失。
// 舊格式資料沒有 updatedAt/deleted 欄位時，視為 updatedAt:0、deleted:false，不會 crash。
function mergeTombstoned(cloud, local, idKey) {
  const cloudMap = new Map((cloud||[]).map(i => [i[idKey], i]));
  const localMap = new Map((local||[]).map(i => [i[idKey], i]));
  const ids = new Set([...cloudMap.keys(), ...localMap.keys()]);
  const merged = [];
  ids.forEach(id => {
    const c = cloudMap.get(id), l = localMap.get(id);
    const item = (c && l) ? ((c.updatedAt||0) >= (l.updatedAt||0) ? c : l) : (c || l);
    merged.push(item);
  });
  return merged;
}

// 合併雲端版與本機版購物清單：以 id 為準，按 updatedAt 取新者（含墓碑），聯集納入雙方各自新增的項目
function mergeShopItems(cloud, local) {
  return mergeTombstoned(cloud, local, 'id');
}

// 儲存互斥鎖：避免快速連續操作（連加兩筆等）並發送出時互蓋
let shopSaving = false, shopSaveQueued = false;
async function syncShopItemsToCloud() {
  if (shopSaving) { shopSaveQueued = true; return; }
  shopSaving = true;
  try {
    let merged = shopItems;
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.shopItems) {
        const cloud = typeof data.shopItems === 'string' ? JSON.parse(data.shopItems) : data.shopItems;
        merged = mergeShopItems(cloud, shopItems);
      }
    } catch (_) { /* 離線時 GET 失敗，退回直接送本機版 */ }
    shopItems = merged;
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    renderShoppingList();
    await syncPush('shopItems', JSON.stringify(shopItems));
  } catch (_) {
    // 靜默失敗，維持本機資料，下次操作或 30 秒輪詢再試
  } finally {
    shopSaving = false;
    if (shopSaveQueued) { shopSaveQueued = false; syncShopItemsToCloud(); }
  }
}

function renderShoppingList() {
  const container = document.getElementById('shop-categories');
  container.innerHTML = '';
  // 軟刪除墓碑（deleted:true）不顯示，但仍留在 shopItems 陣列裡供合併時傳播刪除
  const visibleItems = shopItems.filter(i => !i.deleted);
  const total  = visibleItems.length;
  const bought = visibleItems.filter(i=>i.bought).length;
  document.getElementById('shop-stats').textContent = `已購 ${bought}/${total}`;

  const byCat = {};
  visibleItems.forEach(item => {
    if (!byCat[item.cat]) byCat[item.cat] = [];
    byCat[item.cat].push(item);
  });

  Object.entries(SHOP_CAT).forEach(([cat, catLabel]) => {
    const items = byCat[cat] || [];
    const block = document.createElement('div');
    block.className = 'shop-cat-block';
    block.dataset.cat = cat;
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
        </div>`).join('')}
      <div class="shop-cat-add">
        <input type="text" placeholder="新增到「${catLabel}」…" maxlength="40">
        <button>＋</button>
      </div>`;

    block.querySelectorAll('.shop-item').forEach(row => {
      const id = parseInt(row.dataset.id);
      row.querySelector('input[type=checkbox]').addEventListener('change', e => {
        const it = shopItems.find(i=>i.id===id);
        if (it) { it.bought = e.target.checked; it.updatedAt = Date.now(); saveShopItems(); renderShoppingList(); }
      });
      row.querySelector('.shop-price-input').addEventListener('input', e => {
        const it = shopItems.find(i=>i.id===id);
        if (it) { it.price = parseFloat(e.target.value) || 0; it.updatedAt = Date.now(); saveShopItems(); recalcShopBudget(); }
      });
      row.querySelector('.shop-item-del').addEventListener('click', () => {
        if (confirm('刪除此項目？')) {
          // 軟刪除：留下墓碑而非真的移除，讓合併時能靠 updatedAt 把刪除傳播給還沒拉到的裝置
          const it = shopItems.find(i=>i.id===id);
          if (it) { it.deleted = true; it.updatedAt = Date.now(); }
          saveShopItems(); renderShoppingList();
        }
      });
    });

    const addInput = block.querySelector('.shop-cat-add input');
    const addBtn   = block.querySelector('.shop-cat-add button');
    const doAdd = () => {
      const name = addInput.value.trim();
      if (!name) { addInput.focus(); return; }
      // id 混入隨機尾碼，避免兩人同一毫秒新增時 id 撞號互蓋
      const newId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      shopItems.push({ id: newId, cat, name, bought: false, updatedAt: Date.now() });
      saveShopItems(); renderShoppingList();
      showToast(`已加入「${name}」✓`);
    };
    addBtn.addEventListener('click', doAdd);
    addInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

    container.appendChild(block);
  });
  recalcShopBudget();
}

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
//  SYNC（多裝置共用同一 Flask server）
// ════════════════════════════════════════════
// 注意：shopItems、prep_custom_items 不在此清單中——兩者都走專用的「GET→按 id/key 墓碑合併→POST」流程
// （見 syncShopItemsToCloud、syncPrepCustomItemsToCloud），因為這裡的通用 pull/push 是整包覆蓋，
// 會讓兩人同時新增或刪除互蓋（prep_custom_items 是陣列值，跟 shopItems 同樣不能走整包覆蓋）
//
// prep_ 開頭的其餘鍵（checkbox 勾選狀態）改用前綴比對（見 shouldSyncKey），不逐一列舉：
// 行前準備 checkbox 實際鍵是 prep_vjw0…prep_vjw4、prep_s0…prep_s9、prep_c0…prep_c8、prep_t0…、
// 加上自訂項目動態鍵 prep_${list}_${key}，舊版逐鍵列舉（prep_vjw/prep_tickets/prep_luggage/prep_carry）
// 皆非真實存在的鍵，恆比對不到、從未同步過
const SYNC_KEYS = ['member-a-name', 'member-b-name'];
function shouldSyncKey(key) {
  if (key === 'prep_custom_items') return false; // 走專用合併流程，不能被通用前綴機制整包覆蓋
  return SYNC_KEYS.includes(key) || key.startsWith('prep_');
}

async function syncPush(key, value) {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  } catch (_) {}
}

// in-flight 旗標：visibilitychange 立即拉一次與 30 秒排程輪詢可能同時觸發，避免同時打兩發
let syncPullInFlight = false;
async function syncPull() {
  if (syncPullInFlight) return;
  syncPullInFlight = true;
  try {
    const res = await fetch('/api/sync');
    const data = await res.json();
    let changed = false;
    // prep_ 前綴鍵數量不固定（含使用者自訂項目），改成掃描雲端回傳的所有鍵，不能再逐一列舉比對
    for (const k of Object.keys(data)) {
      if (!shouldSyncKey(k)) continue;
      if (data[k] !== undefined) {
        const local = localStorage.getItem(k);
        const remote = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
        if (local !== remote) {
          _origSetItem(k, remote); // 用原生 setItem 寫入，避免觸發攔截器把剛拉回的值又 push 回去
          changed = true;
        }
      }
    }
    if (changed) {
      initPrepChecklists();
      const a = localStorage.getItem('member-a-name');
      const b = localStorage.getItem('member-b-name');
      if (a) { const el = document.getElementById('member-a'); if (el) el.value = a; }
      if (b) { const el = document.getElementById('member-b'); if (el) el.value = b; }
    }
    // 購物清單：按 id 墓碑合併雲端版與本機版（不能整包覆蓋，否則對方剛新增/刪除的項目會消失）
    if (data.shopItems && !shopSaving) {
      const cloud = typeof data.shopItems === 'string' ? JSON.parse(data.shopItems) : data.shopItems;
      const merged = mergeShopItems(cloud, shopItems);
      if (JSON.stringify(merged) !== JSON.stringify(shopItems)) {
        shopItems = merged;
        localStorage.setItem('shopItems', JSON.stringify(shopItems));
      }
    }
    // 行前準備自訂項目：按 key 墓碑合併（不能走上面前綴整包覆蓋，理由同購物清單）
    if (data.prep_custom_items && !prepCustomSaving) {
      const cloud = typeof data.prep_custom_items === 'string' ? JSON.parse(data.prep_custom_items) : data.prep_custom_items;
      const merged = mergeTombstoned(cloud, loadPrepCustomItems(), 'key');
      if (JSON.stringify(merged) !== JSON.stringify(loadPrepCustomItems())) {
        savePrepCustomItemsLocal(merged);
        initPrepChecklists();
      }
    }
    renderShoppingList();
    updateSyncIndicator('已同步');
  } catch (_) { updateSyncIndicator('離線'); }
  finally { syncPullInFlight = false; }
}

function updateSyncIndicator(text) {
  const el = document.getElementById('sync-indicator');
  if (el) { el.textContent = text === '已同步' ? '☁ 已同步' : '⚡ 離線'; el.dataset.state = text === '已同步' ? 'ok' : 'offline'; }
}

// 攔截 localStorage.setItem 以在儲存時自動同步到 server
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (shouldSyncKey(key)) syncPush(key, value);
};

// 成員名稱變更時同步
['member-a', 'member-b'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', () => {
    localStorage.setItem(`${id}-name`, el.value);
  });
});

// 記帳資料共編：定期比對伺服器最新版本，有變動才重繪（避免蓋掉正在輸入的表單）
let refreshExpensesInFlight = false; // in-flight 旗標：理由同 syncPullInFlight，防止切回前景與排程輪詢同時打兩發
async function refreshExpensesIfChanged() {
  if (localStorage.getItem('exp-pending')) return; // 有待送資料時跳過本輪，避免蓋掉尚未同步的本機記帳
  if (refreshExpensesInFlight) return;
  refreshExpensesInFlight = true;
  try {
    const res = await fetch('/api/expenses');
    const data = await res.json();
    // 走墓碑合併而非整包覆蓋：避免蓋掉本機剛標記刪除、但尚未 saveExpenses 送出的墓碑
    const merged = mergeExpenses(data, expenses);
    if (JSON.stringify(merged) !== JSON.stringify(expenses)) {
      expenses = merged;
      renderExpenseList(); renderSettle(); drawSpendingChart(expenses); drawDailyChart(expenses); updateCurrencyConvert();
    }
  } catch (_) {}
  finally { refreshExpensesInFlight = false; }
}

// 定期拉取（每 30 秒，分頁切到背景時暫停以省電/省流量）；
// 另外監聽 visibilitychange：切回前景時立即拉一次並重置計時器，
// 避免「切回瞬間」與「排程輪詢」剛好前後腳各打一次（用 clearInterval + setInterval 重新起算解決）
let pollTimer = null;
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') { syncPull(); refreshExpensesIfChanged(); }
  }, 30000);
}
startPolling();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncPull(); refreshExpensesIfChanged();
    startPolling(); // 重置 30 秒計時器，避免緊接著排程輪詢又立刻打一次
  }
});

// ════════════════════════════════════════════
//  WEATHER TRIP FORECAST (Open-Meteo)
// ════════════════════════════════════════════
async function loadTripForecast() {
  const startDate = '2026-08-03', endDate = '2026-08-09';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${startDate}&end_date=${endDate}`;
  try {
    const data = await fetchWithCache('trip_forecast', () => fetch(url).then(r => r.json()));
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
  (expArr || []).filter(e => !e.deleted).forEach(e => { totals[e.cat] = (totals[e.cat] || 0) + e.amount; });
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

function drawDailyChart(expArr) {
  const canvas = document.getElementById('dailyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const days = Object.keys(DAY_SHORT);
  const totals = days.map(d => (expArr || []).filter(e => !e.deleted && e.date === d).reduce((s, e) => s + e.amount, 0));
  const maxVal = Math.max(...totals, 1);
  const W = canvas.width, H = canvas.height;
  const pad = { t:16, r:8, b:32, l:44 };
  const barW = (W - pad.l - pad.r) / days.length;
  ctx.clearRect(0, 0, W, H);

  // Y-axis grid lines and labels
  [0, 0.5, 1].forEach(f => {
    const y = H - pad.b - f * (H - pad.t - pad.b);
    ctx.strokeStyle = 'rgba(201,181,142,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#8A6F45';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    const label = f === 0 ? '0' : '¥' + (Math.round(maxVal * f / 1000)) + 'k';
    ctx.fillText(label, pad.l - 2, y + 3);
  });

  // Bars
  totals.forEach((val, i) => {
    const bh = Math.max(val / maxVal * (H - pad.t - pad.b), val > 0 ? 2 : 0);
    const bx = pad.l + i * barW + barW * 0.15;
    const by = H - pad.b - bh;
    ctx.fillStyle = val > 0 ? '#B23A2Ccc' : '#C9B58E33';
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(bx, by, barW * 0.7, bh, [3, 3, 0, 0]); }
    else { ctx.rect(bx, by, barW * 0.7, bh); }
    ctx.fill();
    // X labels
    ctx.fillStyle = '#8A6F45';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(days[i].slice(5), bx + barW * 0.35, H - pad.b + 12);
    // Value above bar
    if (val > 0) {
      ctx.fillStyle = '#3A2E1F';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(val >= 10000 ? Math.round(val/1000)+'k' : val >= 1000 ? (val/1000).toFixed(1)+'k' : val, bx + barW * 0.35, by - 3);
    }
  });
}

function updateCurrencyConvert() {
  const rate = parseFloat(document.getElementById('twd2jpy')?.value) || 4.55;
  const totalJPY = (expenses || []).filter(e => !e.deleted).reduce((s, e) => s + e.amount, 0);
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
//  DIARY
// ════════════════════════════════════════════
const DIARY_DAYS = ['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07','2026-08-08','2026-08-09'];
let activeDiaryDay = DIARY_DAYS[0];

function renderDiaryDayTabs() {
  const container = document.getElementById('diaryDayTabs');
  if (!container) return;
  container.innerHTML = DIARY_DAYS.map(d =>
    `<button class="diary-day-tab${d === activeDiaryDay ? ' active' : ''}" data-day="${d}">${DAY_SHORT[d] || d}</button>`
  ).join('');
  container.querySelectorAll('.diary-day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDiaryDay = btn.dataset.day;
      renderDiaryDayTabs();
      renderDiaryContent();
      syncDiaryFromCloud(); // 切日期也拉一次雲端，長時間停留時才看得到對方剛存的內容（失敗靜默）
    });
  });
}

// 儲存日記資料（照片），容量爆滿時提示使用者而非讓 App 整個壞掉
function saveDiaryData(data) {
  try {
    localStorage.setItem('diaryData', JSON.stringify(data));
    return true;
  } catch (err) {
    showToast('⚠️ 儲存空間已滿，請刪除幾張照片後再試');
    return false;
  }
}

// 讀取日記文字（雲端同步用），並做一次性舊資料遷移：
// 舊版 diaryData[date].text 只有單人欄位，若使用者尚未產生新格式的 a 欄位，
// 就把舊文字搬進「野狼」(a) 欄位，並從 diaryData 移除 text（照片不動）
function loadDiaryText() {
  const diaryText = JSON.parse(localStorage.getItem('diaryText') || '{}');
  const diaryData = JSON.parse(localStorage.getItem('diaryData') || '{}');
  let migrated = false;
  Object.keys(diaryData).forEach(date => {
    const oldText = diaryData[date].text;
    if (oldText && !(diaryText[date] && diaryText[date].a && diaryText[date].a.text)) {
      if (!diaryText[date]) diaryText[date] = {};
      // updatedAt 用 0：遷移的是舊資料，合併時必須輸給雲端任何既有內容，否則過時文字會反蓋掉對方較新的
      diaryText[date].a = { text: oldText, updatedAt: 0 };
      delete diaryData[date].text;
      migrated = true;
    }
  });
  if (migrated) {
    localStorage.setItem('diaryText', JSON.stringify(diaryText));
    saveDiaryData(diaryData);
  }
  return diaryText;
}

// 逐日期逐欄位合併雲端版與本機版：a、b 各自比 updatedAt，新的贏；
// 任一邊沒有的日期/欄位直接補上，確保兩人各自儲存不會互蓋對方欄位
function mergeDiaryText(cloud, local) {
  const merged = {};
  const dates = new Set([...Object.keys(cloud || {}), ...Object.keys(local || {})]);
  dates.forEach(date => {
    const c = (cloud && cloud[date]) || {};
    const l = (local && local[date]) || {};
    merged[date] = {};
    ['a', 'b'].forEach(side => {
      const cSide = c[side], lSide = l[side];
      if (cSide && lSide) merged[date][side] = cSide.updatedAt >= lSide.updatedAt ? cSide : lSide;
      else merged[date][side] = cSide || lSide;
    });
    if (!merged[date].a) delete merged[date].a;
    if (!merged[date].b) delete merged[date].b;
  });
  return merged;
}

function renderDiaryContent() {
  const container = document.getElementById('diaryContent');
  if (!container) return;
  const diaryData = JSON.parse(localStorage.getItem('diaryData') || '{}');
  const diaryText = loadDiaryText();
  const dayData   = diaryData[activeDiaryDay] || { photos: [] };
  const dayText   = diaryText[activeDiaryDay] || {};
  const nameA = getMemberName('a'), nameB = getMemberName('b');
  container.innerHTML = `
    <h3 class="diary-day-heading">${DAY_SHORT[activeDiaryDay] || activeDiaryDay} 的日記</h3>
    <div class="diary-person-block diary-person-a">
      <div class="diary-person-header">🐺 ${escHtml(nameA)}</div>
      <textarea id="diaryText-a" class="diary-textarea" placeholder="記錄今天的心情、感受、有趣的事…" rows="6">${escHtml((dayText.a && dayText.a.text) || '')}</textarea>
      <button id="saveDiary-a" class="diary-save-btn">💾 儲存</button>
    </div>
    <div class="diary-person-block diary-person-b">
      <div class="diary-person-header">🌸 ${escHtml(nameB)}</div>
      <textarea id="diaryText-b" class="diary-textarea" placeholder="記錄今天的心情、感受、有趣的事…" rows="6">${escHtml((dayText.b && dayText.b.text) || '')}</textarea>
      <button id="saveDiary-b" class="diary-save-btn">💾 儲存</button>
    </div>
    <div class="diary-photo-upload" id="photoDropzone">
      <input type="file" id="photoInput" accept="image/*" multiple style="display:none">
      <label for="photoInput" style="cursor:pointer">📷 點擊上傳照片</label>
    </div>
    <div class="diary-photos" id="diaryPhotoGrid"></div>`;
  renderDiaryPhotos(dayData.photos || []);
  document.getElementById('photoInput').addEventListener('change', e => {
    [...e.target.files].forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => addDiaryPhoto(ev.target.result);
      reader.readAsDataURL(file);
    });
  });
  // 編輯中防丟：input 事件即時寫進 localStorage 草稿（不動 updatedAt，updatedAt 只在按儲存時更新）
  ['a', 'b'].forEach(side => {
    document.getElementById(`diaryText-${side}`).addEventListener('input', e => {
      const dt = JSON.parse(localStorage.getItem('diaryText') || '{}');
      if (!dt[activeDiaryDay]) dt[activeDiaryDay] = {};
      const prevUpdatedAt = (dt[activeDiaryDay][side] && dt[activeDiaryDay][side].updatedAt) || 0;
      dt[activeDiaryDay][side] = { text: e.target.value, updatedAt: prevUpdatedAt };
      localStorage.setItem('diaryText', JSON.stringify(dt));
    });
    document.getElementById(`saveDiary-${side}`).addEventListener('click', () => saveDiaryText(activeDiaryDay, side));
  });
}

function renderDiary() {
  renderDiaryDayTabs();
  renderDiaryContent();
  syncDiaryFromCloud();
}

// 切到日記分頁或初次載入時，GET 雲端合併進本機並重繪；失敗靜默用本機版即可
// 只更新「使用者沒改過（與本機 localStorage 相同）」的 textarea，避免蓋掉正在輸入的內容
async function syncDiaryFromCloud() {
  let cloud;
  try { cloud = await (await fetch('/api/diary')).json(); }
  catch { return; }
  const localBefore = JSON.parse(localStorage.getItem('diaryText') || '{}');
  const merged = mergeDiaryText(cloud, localBefore);
  localStorage.setItem('diaryText', JSON.stringify(merged));
  ['a', 'b'].forEach(side => {
    const el = document.getElementById(`diaryText-${side}`);
    if (!el || document.activeElement === el) return; // 使用者正在輸入中，不打斷
    const beforeText = (localBefore[activeDiaryDay] && localBefore[activeDiaryDay][side] && localBefore[activeDiaryDay][side].text) || '';
    if (el.value !== beforeText) return; // 使用者已手動改過但還沒存，不覆蓋
    const mergedText = (merged[activeDiaryDay] && merged[activeDiaryDay][side] && merged[activeDiaryDay][side].text) || '';
    if (el.value !== mergedText) el.value = mergedText;
  });
}

// 儲存互斥鎖：POST 是整份覆寫，兩次 saveDiaryText 並發會互蓋丟資料，進行中的後到請求排隊等前一次完成
let diarySaving = false, diarySaveQueued = null;
async function saveDiaryText(date, side) {
  if (diarySaving) { diarySaveQueued = { date, side }; return; }
  diarySaving = true;
  const btn = document.getElementById(`saveDiary-${side}`);
  const textEl = document.getElementById(`diaryText-${side}`);
  const text = textEl ? textEl.value : '';
  // 1. 更新本機
  const diaryText = JSON.parse(localStorage.getItem('diaryText') || '{}');
  if (!diaryText[date]) diaryText[date] = {};
  diaryText[date][side] = { text, updatedAt: Date.now() };
  localStorage.setItem('diaryText', JSON.stringify(diaryText));
  // token 每次呼叫時讀 localStorage，401 輸入新通行碼後重試才拿得到新值
  const post = async (payload) => fetch('/api/diary', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'x-app-token': localStorage.getItem('exp-token') || '' },
    body: JSON.stringify(payload),
  });
  try {
    let merged = diaryText;
    try {
      const cloud = await (await fetch('/api/diary')).json();
      merged = mergeDiaryText(cloud, diaryText);
    } catch (_) { /* GET 失敗只是少一次合併，仍嘗試 POST 本機版，別把整次儲存當失敗 */ }
    let resp = await post(merged);
    if (resp.status === 401) {
      const input = prompt('請輸入記帳通行碼');
      if (input === null) { showToast('已取消同步，內容已存本機'); return; }
      localStorage.setItem('exp-token', input);
      resp = await post(merged); // 重試一次
      if (resp.status === 401) { showToast('⚠️ 通行碼錯誤，尚未同步雲端'); return; }
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    // 成功後套用合併結果並刷新兩個 textarea（對方有新內容會即時出現）
    localStorage.setItem('diaryText', JSON.stringify(merged));
    if (date === activeDiaryDay) {
      ['a', 'b'].forEach(s => {
        const el = document.getElementById(`diaryText-${s}`);
        if (el && document.activeElement !== el) {
          el.value = (merged[date] && merged[date][s] && merged[date][s].text) || '';
        }
      });
    }
    if (btn) { btn.textContent = '✅ 已同步'; setTimeout(() => { if (btn) btn.textContent = '💾 儲存'; }, 1500); }
  } catch (e) {
    console.error('日記同步失敗', e);
    // 離線/失敗：本機已存（步驟1），提示使用者手動重按，日記不像記帳高頻不做自動重送
    if (btn) { btn.textContent = '📴 已存本機，恢復網路請再按一次儲存'; setTimeout(() => { if (btn) btn.textContent = '💾 儲存'; }, 2500); }
  } finally {
    diarySaving = false;
    if (diarySaveQueued) { const q = diarySaveQueued; diarySaveQueued = null; saveDiaryText(q.date, q.side); }
  }
}

function addDiaryPhoto(base64) {
  const data = JSON.parse(localStorage.getItem('diaryData') || '{}');
  if (!data[activeDiaryDay]) data[activeDiaryDay] = { photos: [] };
  if (!data[activeDiaryDay].photos) data[activeDiaryDay].photos = [];
  data[activeDiaryDay].photos.push(base64);
  if (!saveDiaryData(data)) return;
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
      data[activeDiaryDay].photos.splice(+btn.dataset.idx, 1);
      saveDiaryData(data);
      renderDiaryContent();
    });
  });
}

// ════════════════════════════════════════════
//  WEATHER
// ════════════════════════════════════════════
const WEATHER_LAT = 35.7148, WEATHER_LNG = 139.7967;

function wmoWeather(code) {
  if (code === 0) return ['☀️','晴']; if (code <= 2) return ['🌤','多雲']; if (code === 3) return ['☁️','陰'];
  if (code <= 49) return ['🌫','霧']; if (code <= 59) return ['🌦','毛毛雨']; if (code <= 69) return ['🌧','雨'];
  if (code <= 79) return ['❄️','雪']; if (code <= 82) return ['🌧','陣雨']; if (code <= 86) return ['🌨','陣雪'];
  if (code <= 99) return ['⛈','雷雨']; return ['🌡', String(code)];
}
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
    const [emoji] = wmoWeather(cw.weathercode);
    const iconEl = document.getElementById('weatherCardIcon');
    const descEl = document.getElementById('weatherCardDesc');
    if (iconEl) iconEl.textContent = emoji;
    if (descEl) descEl.textContent = `${Math.round(cw.temperature)}° · 東京淺草`;
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
      const idx = si+i, [emoji] = wmoWeather(h.weathercode[idx]);
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
  } catch(e) { /* fall through */ }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LNG}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=7`;
    const d = (await (await fetch(url)).json()).daily;
    row.innerHTML = d.time.map((date, i) => {
      const [emoji, cond] = wmoWeather(d.weathercode[i]);
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
//  INIT
// ════════════════════════════════════════════
(async () => {
  await loadPlaces();      // 先載入 places.json（權威座標來源），行程座標校正才有東西可比對
  await loadItinerary();
  loadTripForecast();
  await loadExpenses();
  // 有離線暫存時自動重送——必須在 loadExpenses 之後，expenses 才是本機暫存版，太早跑會送出空陣列丟資料
  if (localStorage.getItem('exp-pending')) saveExpenses();
  initPrepChecklists();
  renderShoppingList();
  updateCountdown();
  updatePrepRing();
  await syncPull();
})();

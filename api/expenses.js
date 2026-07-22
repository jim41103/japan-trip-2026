// Vercel Serverless Function — 記帳資料存取（透過 GitHub Gist，與 sync.js 共用同一個 Gist）
const https = require('https');

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;
const GSHEET_URL = process.env.GSHEET_URL;     // Google Apps Script 網頁應用程式網址
const GSHEET_TOKEN = process.env.GSHEET_TOKEN; // 須與 Apps Script 內 TOKEN 一致
const APP_TOKEN = process.env.APP_TOKEN;       // 記帳寫入通行碼，未設則不擋（GET 一律不擋）

// 轉發整份清單給試算表同步（失敗不影響記帳本身，但結果回傳給前端以免靜默失效）
// 注意：傳入前必須排除 deleted:true 的軟刪除墓碑——Apps Script 靠「來源ID」欄比對做同步刪除，
// 墓碑不在推送清單中即代表試算表對應列會被移除，這正是刪除要傳播到試算表的期望行為；
// 若把墓碑也送過去，等同把它當成一筆正常記錄重新寫回試算表。
async function pushToSheet(expenses) {
  if (!GSHEET_URL) return { status: 'skipped' };
  try {
    const active = (expenses || []).filter(e => !e.deleted);
    const resp = await fetch(GSHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: GSHEET_TOKEN, expenses: active }),
      redirect: 'follow', // Apps Script 回應會經過一次 302 轉址
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const result = await resp.json(); // 權限錯誤時 Apps Script 回 HTML，這裡會拋錯
    if (result.error) throw new Error(result.error);
    return result; // { status:'ok', added, removed }
  } catch (e) {
    console.error('gsheet sync failed:', e.message);
    return { status: 'failed', message: e.message };
  }
}

// 跟 app.js 的 mergeTombstoned 同一套演算法搬一份到後端：按 id、updatedAt 取新者（含軟刪除墓碑）。
// 原本 POST 是「client 自己 GET→merge→整包 POST 覆蓋」，跟 sync.js 修過的那個 bug是同一類：
// 兩裝置幾乎同時各自記一筆帳，用的都是「對方寫入前」的舊快照去合併，後送達的整包覆蓋掉先送達的。
function mergeTombstoned(cloudArr, localArr, idKey) {
  const cloudMap = new Map((cloudArr || []).map(i => [i[idKey], i]));
  const localMap = new Map((localArr || []).map(i => [i[idKey], i]));
  const ids = new Set([...cloudMap.keys(), ...localMap.keys()]);
  const merged = [];
  ids.forEach(id => {
    const c = cloudMap.get(id), l = localMap.get(id);
    const item = (c && l) ? ((c.updatedAt || 0) >= (l.updatedAt || 0) ? c : l) : (c || l);
    merged.push(item);
  });
  return merged;
}

function ghRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'japan-trip-sync',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const gist = await ghRequest('GET', `/gists/${GIST_ID}`);
    const content = gist.files?.['expenses.json']?.content || '[]';
    try { res.json(JSON.parse(content)); }
    catch { res.json([]); }

  } else if (req.method === 'POST') {
    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // PATCH 後延遲驗證：太早驗證會像 sync.js 實測過的那樣「驗過但馬上被另一裝置晚到的寫入蓋掉」。
    // 驗證失敗代表這段等待期間有別的裝置也寫入了，拿最新雲端資料跟這次要寫的 incoming 重新做一次
    // tombstone 合併（而不是像原本一樣整包硬蓋），才不會把對方剛記的帳弄丟。
    // 時間預算：2 次 attempt，每次 1 PATCH + 500ms 等待 + 1 次驗證 GET，保守估計 ≈ 4.2 秒，
    // 加上後面 pushToSheet 呼叫 Google Apps Script（約 1-3 秒），沒有 functions.maxDuration 設定，
    // 吃 Vercel Hobby 預設 10 秒硬上限，抓 2 次重試留安全邊際。
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let toWrite = incoming, ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      if (attempt > 0) await wait(100 + Math.random() * 150);
      await ghRequest('PATCH', `/gists/${GIST_ID}`, {
        files: { 'expenses.json': { content: JSON.stringify(toWrite, null, 2) } }
      });
      await wait(500);
      const verify = await ghRequest('GET', `/gists/${GIST_ID}`);
      const verifyData = JSON.parse(verify.files?.['expenses.json']?.content || '[]');
      ok = JSON.stringify(verifyData) === JSON.stringify(toWrite);
      if (!ok) toWrite = mergeTombstoned(verifyData, incoming, 'id'); // 被別人插隊寫入了，拿最新資料重新合併這筆再試
    }
    const sheet = await pushToSheet(toWrite); // 同步 Google 試算表
    res.json({ status: ok ? 'ok' : 'conflict', expenses: toWrite, sheet });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

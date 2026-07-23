// Vercel Serverless Function — 日記文字雲端同步（透過 GitHub Gist，與 expenses.js 共用同一個 Gist）
// 注意：照片不上雲（base64 太大會撞 Gist 限制），只同步文字內容
const https = require('https');

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;
const APP_TOKEN = process.env.APP_TOKEN; // 寫入通行碼，與記帳共用，未設則不擋（GET 一律不擋）

// 跟 app.js 的 mergeDiaryText 同一套演算法搬一份到後端：兩人各自的 a/b 欄位分別按 updatedAt 取新者。
// 原本 POST 是「client 自己 GET→merge→整包 POST 覆蓋」，跟 sync.js/expenses.js 修過的是同一類 bug：
// 兩人幾乎同時各自寫日記，用的都是「對方寫入前」的舊快照去合併，後送達的整包覆蓋掉先送達的。
function mergeDiaryText(cloudObj, localObj) {
  const merged = {};
  const dates = new Set([...Object.keys(cloudObj || {}), ...Object.keys(localObj || {})]);
  dates.forEach(date => {
    const c = (cloudObj && cloudObj[date]) || {};
    const l = (localObj && localObj[date]) || {};
    merged[date] = {};
    ['a', 'b'].forEach(side => {
      const cSide = c[side], lSide = l[side];
      if (cSide && lSide) merged[date][side] = (cSide.updatedAt || 0) >= (lSide.updatedAt || 0) ? cSide : lSide;
      else merged[date][side] = cSide || lSide;
    });
    if (!merged[date].a) delete merged[date].a;
    if (!merged[date].b) delete merged[date].b;
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
    const content = gist.files?.['diary.json']?.content || '{}';
    try { res.json(JSON.parse(content)); }
    catch { res.json({}); }

  } else if (req.method === 'POST') {
    if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // PATCH 後延遲驗證：太早驗證會像 sync.js 實測過的那樣「驗過但馬上被另一裝置晚到的寫入蓋掉」。
    // 驗證失敗代表這段等待期間有別的裝置也寫入了，拿最新雲端資料跟這次要寫的 incoming
    // 重新做一次 mergeDiaryText 合併（而不是整包硬蓋），才不會把對方剛寫的日記弄丟。
    // 沒有像記帳那樣呼叫外部 Google Apps Script，時間預算比照 sync.js：
    // 2 次 attempt，每次 1 PATCH + 500ms 等待 + 1 次驗證 GET，最壞情況 ≈ 5.8 秒，安全邊際足夠。
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let toWrite = incoming, ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      if (attempt > 0) await wait(100 + Math.random() * 150);
      await ghRequest('PATCH', `/gists/${GIST_ID}`, {
        files: { 'diary.json': { content: JSON.stringify(toWrite, null, 2) } }
      });
      await wait(500);
      const verify = await ghRequest('GET', `/gists/${GIST_ID}`);
      const verifyData = JSON.parse(verify.files?.['diary.json']?.content || '{}');
      ok = JSON.stringify(verifyData) === JSON.stringify(toWrite);
      if (!ok) toWrite = mergeDiaryText(verifyData, incoming); // 被別人插隊寫入了，拿最新資料重新合併這筆再試
    }
    res.json({ status: ok ? 'ok' : 'conflict', diary: toWrite });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

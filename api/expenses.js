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
    await ghRequest('PATCH', `/gists/${GIST_ID}`, {
      files: { 'expenses.json': { content: JSON.stringify(incoming, null, 2) } }
    });
    const sheet = await pushToSheet(incoming); // 同步 Google 試算表
    res.json({ status: 'ok', sheet });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

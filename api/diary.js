// Vercel Serverless Function — 日記文字雲端同步（透過 GitHub Gist，與 expenses.js 共用同一個 Gist）
// 注意：照片不上雲（base64 太大會撞 Gist 限制），只同步文字內容
const https = require('https');

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;
const APP_TOKEN = process.env.APP_TOKEN; // 寫入通行碼，與記帳共用，未設則不擋（GET 一律不擋）

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
    await ghRequest('PATCH', `/gists/${GIST_ID}`, {
      files: { 'diary.json': { content: JSON.stringify(incoming, null, 2) } }
    });
    res.json({ status: 'ok' });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

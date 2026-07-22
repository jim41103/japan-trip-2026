// Vercel Serverless Function — sync via GitHub Gist
const https = require('https');

const GIST_ID = process.env.GIST_ID;
const GH_TOKEN = process.env.GH_TOKEN;

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const gist = await ghRequest('GET', `/gists/${GIST_ID}`);
    const content = gist.files?.['sync.json']?.content || '{}';
    try { res.json(JSON.parse(content)); }
    catch { res.json({}); }

  } else if (req.method === 'POST') {
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // GET→merge→PATCH 不是原子操作：兩個人（兩台裝置）幾乎同時各自送出不同的鍵時，
    // 兩邊都各自讀到「對方寫入前」的舊快照、各自 merge、各自整包 PATCH 回去，
    // 後完成的那次會把先完成、但沒出現在自己那份舊快照裡的鍵直接覆蓋消失，兩邊都不會收到任何錯誤。
    // 這裡用「寫入後立刻讀回驗證」＋失敗重試（重新讀最新資料再合併一次）來大幅縮小這個窗口，
    // 不是完美的鎖，但對「兩人偶爾同時打勾」這種輕度並發已經足夠可靠。
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 150 + Math.random() * 250));
      const gist = await ghRequest('GET', `/gists/${GIST_ID}`);
      const existing = JSON.parse(gist.files?.['sync.json']?.content || '{}');
      const merged = Object.assign({}, existing, incoming);
      await ghRequest('PATCH', `/gists/${GIST_ID}`, {
        files: { 'sync.json': { content: JSON.stringify(merged, null, 2) } }
      });
      const verifyGist = await ghRequest('GET', `/gists/${GIST_ID}`);
      const verifyData = JSON.parse(verifyGist.files?.['sync.json']?.content || '{}');
      ok = Object.keys(incoming).every(k => JSON.stringify(verifyData[k]) === JSON.stringify(incoming[k]));
    }
    res.json({ status: ok ? 'ok' : 'conflict' });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

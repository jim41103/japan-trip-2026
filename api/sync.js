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
    // 取得現有資料
    const gist = await ghRequest('GET', `/gists/${GIST_ID}`);
    const existing = JSON.parse(gist.files?.['sync.json']?.content || '{}');
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    Object.assign(existing, incoming);

    await ghRequest('PATCH', `/gists/${GIST_ID}`, {
      files: { 'sync.json': { content: JSON.stringify(existing, null, 2) } }
    });
    res.json({ status: 'ok' });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

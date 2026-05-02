// Vercel Serverless Function — Gemini AI Japan Travel Assistant
const https = require('https');

const SYSTEM_PROMPT = `你是日本旅遊專家，正在協助規劃一趟 2026 年 8/3-8/8 的日本行程（東京為主，含鎌倉、富士山、成田機場周邊）。
- 回答要精簡實用，直接提供具體建議
- 景點推薦請附上緯度/經度（小數點後4位）
- 若是推薦地點請用 JSON 格式回傳（見指示）
- 繁體中文回答`;

function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Promise.reject(new Error('GEMINI_API_KEY 未設定'));

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
    generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(payload);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { type, date, places, category, question } = body || {};
  const catNames = { culture:'文化景點', food:'美食', shopping:'購物血拚', relax:'輕鬆散步', mix:'綜合推薦' };

  try {
    if (type === 'recommend') {
      const placeList = (places || []).map(p => p.name).join('、') || '尚無安排';
      const catName = catNames[category] || category || '綜合推薦';
      const prompt = `當天日期：${date || '未知'}
當天已有行程：${placeList}
想找的類型：${catName}

請根據當天行程的地理位置，推薦附近 5 個符合「${catName}」的真實景點。
只回傳 JSON 陣列，格式如下，不要加任何說明或 markdown：
[{"name":"景點名稱","desc":"10字以內介紹","lat":緯度數字,"lng":經度數字}]`;

      const data = await callGemini(prompt);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\[[\s\S]*?\]/);
      if (!match) return res.status(500).json({ error: '解析失敗', raw: text });
      const suggestions = JSON.parse(match[0]);
      return res.json({ suggestions });

    } else if (type === 'ask') {
      const placeContext = (places || []).length
        ? `（目前行程：${places.map(p => p.name).join('、')}）`
        : '';
      const data = await callGemini(question + placeContext);
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.json({ answer });

    } else {
      return res.status(400).json({ error: 'type 必須為 recommend 或 ask' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

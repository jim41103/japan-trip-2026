// Vercel Serverless Function — Groq AI Japan Travel Assistant
const https = require('https');

const SYSTEM_PROMPT = `你是日本旅遊專家，正在協助規劃一趟 2026 年 8/3-8/8 的日本行程（東京為主，含鎌倉、富士山、成田機場周邊）。
- 回答要精簡實用，直接提供具體建議
- 景點推薦請附上緯度/經度（小數點後4位）
- 若是推薦地點請用 JSON 格式回傳（見指示）
- 繁體中文回答`;

function callGroq(userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return Promise.reject(new Error('GROQ_API_KEY 未設定，請至 Vercel 環境變數新增'));

  const payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userMessage },
    ],
    max_tokens: 1200,
    temperature: 0.7,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString());
          if (parsed.error) {
            reject(new Error(`Groq API 錯誤：${parsed.error.message || JSON.stringify(parsed.error)}`));
            return;
          }
          resolve(parsed);
        }
        catch(e) { reject(new Error('JSON 解析失敗：' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('請求逾時，請稍後再試')); });
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
只回傳 JSON 陣列，不要加任何說明、markdown 或 code block：
[{"name":"景點名稱","desc":"10字以內介紹","lat":緯度數字,"lng":經度數字}]`;

      const data = await callGroq(prompt);
      const text = data.choices?.[0]?.message?.content || '';

      if (!text) return res.status(500).json({ error: 'AI 未回傳文字，請確認 GROQ_API_KEY 是否正確' });

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return res.status(500).json({ error: `解析失敗，AI 回傳：${text.slice(0, 120)}` });

      let suggestions;
      try { suggestions = JSON.parse(match[0]); }
      catch(e) { return res.status(500).json({ error: `JSON 格式錯誤：${e.message}` }); }

      return res.json({ suggestions });

    } else if (type === 'ask') {
      const placeContext = (places || []).length
        ? `（目前行程：${places.map(p => p.name).join('、')}）`
        : '';
      const askPrompt = `${question}${placeContext}

請用自然、口語的繁體中文回答，像在跟朋友聊天一樣。
不要使用 JSON、程式碼、markdown 格式或任何符號標記，直接用白話文回答即可。`;
      const data = await callGroq(askPrompt);
      const answer = data.choices?.[0]?.message?.content || '';

      if (!answer) return res.status(500).json({ error: 'AI 未回傳文字，請確認 GROQ_API_KEY 是否正確' });

      return res.json({ answer });

    } else {
      return res.status(400).json({ error: 'type 必須為 recommend 或 ask' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

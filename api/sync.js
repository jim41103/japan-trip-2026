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
    //
    // 「PATCH 完立刻驗證」實測仍會漏（TOCTOU）：A 驗證當下資料正確、但緊接著 B 那邊基於
    // 更舊快照的 PATCH 才姍姍來遲落地蓋過去，A 的驗證早就通過了、根本沒機會發現。
    // 改法：驗證前先等一段時間，讓「幾乎同時發生」的競爭寫入有機會先落地，才不會驗證得太早；
    // 通過後再等一次、驗證第二次，確認沒有更晚到的競爭寫入把資料蓋掉。兩次都過才真正放心。
    // 這仍不是真正的鎖（純 GET+PATCH 沒有原子的 compare-and-swap 可用），
    // 但對「兩人偶爾同時打勾」這種人類操作時間尺度的輕度並發，已經足夠可靠。
    // 注意：這個專案的 vercel.json 沒設 functions.maxDuration，Vercel Hobby 方案預設 10 秒硬上限，
    // 逾時整個 function 直接被砍斷（連 res.json 都來不及回，前端只會看到 fetch 失敗），
    // 而且 Hobby 方案就算設 maxDuration 也衝不破這 10 秒，所以下面的重試/等待次數必須留夠安全邊際，
    // 不能為了「多驗證幾次」把總時長逼近上限——寧可少驗一點，也不要整個請求被砍斷。
    // 用保守估計「每次 GitHub API 呼叫抓 800ms」反推：2 次 attempt、每個 attempt 3 次呼叫（GET+PATCH+驗證GET）
    // + 500ms 固定等待，最壞情況 ≈ 2 × (3×800ms + 500ms) ≈ 5.8 秒，留了將近 4 秒安全邊際。
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const matches = data => Object.keys(incoming).every(k => JSON.stringify(data[k]) === JSON.stringify(incoming[k]));
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      if (attempt > 0) await wait(100 + Math.random() * 150);
      const gist = await ghRequest('GET', `/gists/${GIST_ID}`);
      const existing = JSON.parse(gist.files?.['sync.json']?.content || '{}');
      const merged = Object.assign({}, existing, incoming);
      await ghRequest('PATCH', `/gists/${GIST_ID}`, {
        files: { 'sync.json': { content: JSON.stringify(merged, null, 2) } }
      });
      await wait(500); // 讓幾乎同時的競爭寫入有時間落地，太早驗證會驗過但馬上被蓋掉（實測重現過這個 TOCTOU）
      const verify = await ghRequest('GET', `/gists/${GIST_ID}`);
      const verifyData = JSON.parse(verify.files?.['sync.json']?.content || '{}');
      ok = matches(verifyData);
    }
    res.json({ status: ok ? 'ok' : 'conflict' });
  } else {
    res.status(405).json({ error: 'method not allowed' });
  }
};

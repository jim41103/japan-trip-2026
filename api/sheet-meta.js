// Vercel Serverless Function — 唯讀取回試算表的匯率與已結清狀態（供網頁記帳分頁顯示用）
const GSHEET_URL = process.env.GSHEET_URL;     // Google Apps Script 網頁應用程式網址
const GSHEET_TOKEN = process.env.GSHEET_TOKEN; // 須與 Apps Script 內 TOKEN 一致

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!GSHEET_URL) return res.json({ rate: null, settledIds: [] });
  try {
    const resp = await fetch(`${GSHEET_URL}?token=${GSHEET_TOKEN}`, { redirect: 'follow' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) {
    console.error('sheet-meta 取得失敗:', e.message);
    res.json({ rate: null, settledIds: [] });
  }
};

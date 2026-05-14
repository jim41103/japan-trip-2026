// api/tenki-weekly.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const RSS_URL = 'https://tenki.jp/rss/forecast/3/16/4410/13/1-week.xml';
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JapanTripApp/1.0)' },
    });
    if (!res.ok) throw new Error(`tenki.jp ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
      const b = m[1];
      const get = tag => { const r = b.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)); return r ? (r[1]||r[2]||'').trim() : ''; };
      return { title: get('title'), description: get('description'), link: get('link') };
    });
    const days = items.map(item => {
      const dm = item.title.match(/(\d+)月(\d+)日/);
      const dateStr = dm ? `2026-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}` : '';
      const hi  = item.description.match(/最高(\d+)/);
      const lo  = item.description.match(/最低(\d+)/);
      const rn  = item.description.match(/降水確率[^\d]*(\d+)/);
      return {
        date: dateStr,
        condition: item.description.split(/[。、\s]/)[0] || '',
        hi:   hi  ? parseInt(hi[1])  : null,
        lo:   lo  ? parseInt(lo[1])  : null,
        rainPct: rn ? parseInt(rn[1]) : null,
        link: item.link,
      };
    });
    return new Response(JSON.stringify({ source: 'tenki.jp', days }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, days: [] }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

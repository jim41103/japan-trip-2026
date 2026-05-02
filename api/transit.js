// Vercel Serverless Function — Yahoo Japan Transit proxy
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept-Language': 'ja,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function parseRoutes(html) {
  // 解析 Yahoo Japan Transit HTML 結果
  const routes = [];
  const routeMatches = html.match(/id="route\d+"/g);
  if (!routeMatches) return routes;

  const summaryRegex = /<li[^>]*class="[^"]*resultItem[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let summaryMatch;
  const summaries = [];
  while ((summaryMatch = summaryRegex.exec(html)) !== null) {
    summaries.push(summaryMatch[1]);
  }

  routeMatches.forEach((idAttr, idx) => {
    const routeId = idAttr.replace(/id="|"/g, '');
    const routeStart = html.indexOf(`id="${routeId}"`);
    const routeEnd = html.indexOf('id="route', routeStart + 10) > -1
      ? html.indexOf('id="route', routeStart + 10)
      : html.indexOf('<!-- /route', routeStart);
    const routeHtml = routeEnd > 0 ? html.slice(routeStart, routeEnd) : html.slice(routeStart, routeStart + 20000);

    // 摘要資訊
    const timeMatch = routeHtml.match(/(\d{1,2}:\d{2})[^<]*<[^>]+>[^<]*(\d{1,2}:\d{2})/);
    const fareMatch = routeHtml.match(/(\d[\d,]+)円/);
    const durationMatch = routeHtml.match(/(\d+)分/);
    const transferMatch = routeHtml.match(/乗換[：:]\s*(\d+)/);

    // 站點時刻表
    const stops = [];
    const stopRegex = /<li[^>]*class="[^"]*stop[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
    let stopMatch;
    while ((stopMatch = stopRegex.exec(routeHtml)) !== null) {
      const stopHtml = stopMatch[1];
      const nameMatch = stopHtml.match(/class="[^"]*stopName[^"]*"[^>]*>([^<]+)</);
      const timeMatch2 = stopHtml.match(/(\d{1,2}:\d{2})/);
      if (nameMatch) {
        stops.push({ name: nameMatch[1].trim(), time: timeMatch2 ? timeMatch2[1] : '' });
      }
    }

    // 月台與車廂資訊
    const platforms = [];
    const platRegex = /<li[^>]*class="[^"]*platform[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
    let platMatch;
    while ((platMatch = platRegex.exec(routeHtml)) !== null) {
      platforms.push(platMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    const dep = timeMatch ? timeMatch[1] : '';
    const arr = timeMatch ? timeMatch[2] : '';
    routes.push({
      index: idx + 1,
      id: routeId,
      priority: idx === 0 ? '推薦' : idx === 1 ? '最省錢' : '最快',
      depArr: dep && arr ? `${dep} → ${arr}` : '',
      departure: dep,
      arrival: arr,
      duration: durationMatch ? durationMatch[1] + '分' : '',
      fare: fareMatch ? fareMatch[1].replace(',', '') + '円' : '',
      transfers: transferMatch ? transferMatch[1] + '次換乘' : '',
      stops,
      platforms,
    });
  });

  return routes;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { from, to, y, m, d, hh, m1, m2, way = '0' } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from/to required' });

  const year  = y  || '2026';
  const month = m  || '08';
  const day   = d  || '03';
  const hour  = hh || '09';
  const min1  = m1 || '0';
  const min2  = m2 || '0';

  const url = `https://transit.yahoo.co.jp/search/result?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&y=${year}&m=${month}&d=${day}&hh=${hour}&m1=${min1}&m2=${min2}&type=${way}&ws=3&expkind=1&ticket=ic`;

  try {
    const html = await fetchUrl(url);
    const routes = parseRoutes(html);
    res.json({ from, to, routes, sourceUrl: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

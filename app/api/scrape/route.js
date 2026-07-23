export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// ─── Image validator — blocks logos, icons, tracking pixels ─────────────────
function isValidDisasterImage(src) {
  if (!src || !src.startsWith('http')) return false;
  const bad = [
    'google.com', 'gstatic.com', 'googlelogo', 'google-logo',
    'logo', 'icon', 'favicon', 'avatar', 'sprite', 'placeholder',
    'blank.', 'pixel.', 'tracking', 'badge', 'subscribe',
    'newsletter', 'profile_image', 'thumb_up', 'emoji',
    '1x1', '2x2', 'spacer', 'noimage', 'default-image',
  ];
  const lower = src.toLowerCase();
  if (bad.some(b => lower.includes(b))) return false;
  return true;
}

// Outlets we trust as "big websites" for disaster coverage. GDELT indexes
// thousands of domains; we boost (not strictly require) these so well-known
// sources rank to the top, the same way Watchers/BBC/AP did before.
const TRUSTED_DOMAINS = [
  'watchers.news', 'bbc.com', 'bbc.co.uk', 'apnews.com', 'reuters.com',
  'aljazeera.com', 'cnn.com', 'theguardian.com', 'volcanodiscovery.com',
  'usatoday.com', 'npr.org', 'skynews.com', 'abcnews.go.com', 'cbsnews.com',
  'nytimes.com', 'washingtonpost.com', 'dawn.com', 'tribune.com.pk',
];

function buildArticle(headline, url, imageUrl, source, publishedAt) {
  if (!headline || !url) return null;
  if (!url.startsWith('http')) url = 'https:' + url;
  const cleanImage = isValidDisasterImage(imageUrl) ? imageUrl : null;
  return {
    headline: headline.trim().slice(0, 200),
    url,
    mediaFeeds: cleanImage ? [{ src: cleanImage, alt: headline }] : [],
    source,
    publishedAt: publishedAt || null, // internal-only, used for scoring
  };
}

function dedup(articles) {
  const seen = new Set();
  return articles.filter(a => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// GDELT wants YYYYMMDDHHMMSS in UTC
function toGdeltDate(ms) {
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

// Parse GDELT's seendate format: YYYYMMDDTHHMMSSZ
function parseGdeltDate(s) {
  if (!s) return null;
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(s);
  if (!m) return null;
  const [, y, mo, da, h, mi, se] = m;
  return Date.UTC(+y, +mo - 1, +da, +h, +mi, +se);
}

function buildQuery(city, country, region) {
  const term = city || region || country;
  return `${term} earthquake`;
}

// ─── Source 1: GDELT DOC API — covers BBC, Watchers, AP, Reuters, and
//     virtually every other major outlet in one fast JSON call, pinned to
//     a window around the quake's own timestamp ──────────────────────────────
async function scrapeGDELT(query, eventTimeMs) {
  const results = [];
  try {
    const start = toGdeltDate(eventTimeMs - 2 * 60 * 60 * 1000); // 2h before (clock skew buffer)
    const end = toGdeltDate(eventTimeMs + 5 * 24 * 60 * 60 * 1000); // up to 5 days after
    const api = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=20&startdatetime=${start}&enddatetime=${end}&sort=hybridrel&format=json`;
    const res = await withTimeout(fetch(api, { headers: { Accept: 'application/json' } }), 5000);
    if (!res.ok) return results;
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return results; }
    for (const item of (data?.articles || [])) {
      const published = parseGdeltDate(item.seendate);
      const art = buildArticle(item.title, item.url,item.socialimage, item.domain || 'News', published);
      if (art) results.push(art);
    }
  } catch (e) {
    console.error('GDELT error:', e.message);
  }
  return results;
}

// ─── Source 2: ReliefWeb API — UN disaster portal, dated at/after the quake ──
async function scrapeReliefWeb(query, eventTimeMs) {
  const results = [];
  try {
    const fromDate = new Date(eventTimeMs - 24 * 60 * 60 * 1000).toISOString();
    const api = `https://api.reliefweb.int/v1/reports?appname=eq-monitor&query[value]=${encodeURIComponent(query)}&filter[field]=date.created&filter[value][from]=${encodeURIComponent(fromDate)}&fields[include][]=title&fields[include][]=url&fields[include][]=file&fields[include][]=date&limit=6&sort[]=date:desc`;
    const res = await withTimeout(fetch(api, { headers: { Accept: 'application/json' } }), 5000);
    if (!res.ok) return results;
    const data = await res.json();
    for (const item of (data?.data || [])) {
      const f = item.fields || {};
      const img = f.file?.[0]?.preview?.url || null;
      const published = f.date?.created ? Date.parse(f.date.created) : null;
      const art = buildArticle(f.title, f.url || `https://reliefweb.int/node/${item.id}`, img, 'ReliefWeb (UN)', published);
      if (art) results.push(art);
    }
  } catch (e) {
    console.error('ReliefWeb error:', e.message);
  }
  return results;
}

function isTrustedDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return TRUSTED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

// ─── Relevance scoring: must match THIS event's location AND be published
//     within a tight window of THIS event's time. Trusted big outlets get a
//     ranking boost so BBC/Watchers/AP/etc surface above smaller blogs ──────
function scoreArticle(article, city, country, region, magnitude, eventTimeMs) {
  const title = (article.headline || '').toLowerCase();

  const seismic = ['earthquake', 'quake', 'tremor', 'seismic', 'tsunami', 'magnitude', 'aftershock', 'shaking', 'richter'];
  if (!seismic.some(w => title.includes(w))) return -1;

  const norm = s => (s || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const cityWords = norm(city).split(/\s+/).filter(w => w.length > 2);
  const countryWords = norm(country).split(/\s+/).filter(w => w.length > 2);
  const regionWords = norm(region).split(/\s+/).filter(w => w.length > 2);

  let score = 0;
  let locationMatch = false;

  if (cityWords.some(w => title.includes(w))) { score += 5; locationMatch = true; }
  if (countryWords.some(w => title.includes(w))) { score += 3; locationMatch = true; }
  if (regionWords.some(w => title.includes(w))) { score += 2; locationMatch = true; }
  if (!locationMatch) return -1;

  if (magnitude) {
    const magStr = parseFloat(magnitude).toFixed(1);
    if (title.includes(magStr) || title.includes(String(Math.round(parseFloat(magnitude))))) score += 4;
  }

  if (article.publishedAt && eventTimeMs) {
    const hoursAfter = (article.publishedAt - eventTimeMs) / (1000 * 60 * 60);
    if (hoursAfter < -2) return -1; // published before the quake — wrong event
    if (hoursAfter <= 48) score += 3;
    else if (hoursAfter <= 120) score += 1;
    else return -1; // more than 5 days later — too stale
  }

  if (isTrustedDomain(article.url)) score += 3; // boost big, known outlets
  if (article.mediaFeeds?.length > 0) score += 1;

  return score;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get('city') || '').trim();
  const country = (searchParams.get('country') || '').trim();
  const region = (searchParams.get('region') || '').trim();
  const magnitude = (searchParams.get('magnitude') || '').trim();
  const eventTime = parseInt(searchParams.get('eventTime') || '', 10);

  if (!city && !country) {
    return NextResponse.json({ success: false, error: 'No location provided' }, { status: 400 });
  }
  if (!eventTime || Number.isNaN(eventTime)) {
    return NextResponse.json({ success: false, error: 'eventTime is required' }, { status: 400 });
  }

  const query = buildQuery(city, country, region);

  try {
    const [gdelt, reliefWeb] = await Promise.allSettled([
      scrapeGDELT(query, eventTime),
      scrapeReliefWeb(query, eventTime),
    ]);

    const allArticles = [
      ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
      ...(reliefWeb.status === 'fulfilled' ? reliefWeb.value : []),
    ].filter(Boolean);

    let scored = allArticles
      .map(a => ({ article: a, score: scoreArticle(a, city, country, region, magnitude, eventTime) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    // Widen fallback (still time-pinned) only if strict matching found nothing
    if (scored.length === 0 && country) {
      const broad = await scrapeGDELT(`${country} earthquake`, eventTime);
      scored = broad
        .map(a => ({ article: a, score: scoreArticle(a, city, country, region, magnitude, eventTime) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score);
    }

    const unique = dedup(scored.map(({ article }) => article)).map(a => {
      const { publishedAt, ...rest } = a;
      return rest;
    });

    const sorted = [
      ...unique.filter(a => a.mediaFeeds?.length > 0),
      ...unique.filter(a => !a.mediaFeeds?.length),
    ].slice(0, 12);

    return NextResponse.json({ success: true, data: sorted });
  } catch (err) {
    console.error('Scraper fatal:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
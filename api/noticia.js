// Gamarra TV - Social preview for Facebook/WhatsApp/etc.
// URL pública: /noticia/slug-de-la-noticia

const SUPABASE_URL = 'https://hjexlltqhjdmlwxgptpj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsF';
const FALLBACK_IMAGE = 'https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png';
const SITE_NAME = 'Gamarra TV';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function siteOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'gamarratv.vercel.app').split(',')[0].trim();
  return `${proto}://${host}`;
}

function isCrawler(req) {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  return /facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|pinterest|slackbot|discordbot|googlebot|bingbot/i.test(ua);
}

function absoluteImage(url, origin) {
  const value = String(url || '').trim();
  if (!value) return FALLBACK_IMAGE;
  try { return new URL(value, origin).href; } catch { return FALLBACK_IMAGE; }
}

async function getArticle(requestedSlug) {
  // select=* avoids breaking the preview if the Supabase table has an older/newer schema.
  const endpoint = `${SUPABASE_URL}/rest/v1/noticias?select=*&publicada=eq.true&limit=1000`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
  const rows = await response.json();
  return rows.find(n => String(n.slug || '') === requestedSlug)
    || rows.find(n => String(n.id || '') === requestedSlug)
    || rows.find(n => slugify(n.titulo) === requestedSlug);
}

module.exports = async function handler(req, res) {
  const requestedSlug = String(req.query?.slug || '').trim();
  const origin = siteOrigin(req);

  if (!requestedSlug) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  try {
    const article = await getArticle(requestedSlug);

    if (!article) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end('<!doctype html><html><head><meta charset="utf-8"><title>Noticia no encontrada | Gamarra TV</title></head><body>Noticia no encontrada.</body></html>');
    }

    const finalSlug = String(article.slug || slugify(article.titulo) || article.id);
    const shareUrl = `${origin}/noticia/${encodeURIComponent(finalSlug)}`;
    const appUrl = `${origin}/#/noticia/${encodeURIComponent(finalSlug)}`;
    const title = String(article.titulo || 'Noticia');
    const description = String(article.resumen || 'Noticias, televisión y actualidad de Gamarra TV.').replace(/\s+/g, ' ').trim().slice(0, 300);
    const image = absoluteImage(article.imagen_url, origin);
    const fullTitle = `${title} | ${SITE_NAME}`;

    // IMPORTANT: crawlers receive the OG document directly. No JavaScript or meta-refresh
    // is used for Facebook, because social crawlers need to read the tags immediately.
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(shareUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="es_CO">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<img src="${esc(image)}" alt="${esc(title)}" width="1200" height="630">
<p><a href="${esc(appUrl)}">Leer la noticia completa en Gamarra TV</a></p>
</main>
${isCrawler(req) ? '' : `<script>window.location.replace(${JSON.stringify(appUrl)});</script>`}
</body>
</html>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    return res.end(html);
  } catch (error) {
    console.error('Social preview error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<!doctype html><html><head><meta charset="utf-8"><title>Gamarra TV</title></head><body>Error al cargar la noticia.</body></html>');
  }
};

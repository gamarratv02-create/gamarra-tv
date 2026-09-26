// Dynamic social preview for Gamarra TV news articles.
// Vercel Serverless Function: /noticia/:slug -> /api/noticia?slug=:slug

const SUPABASE_URL = 'https://hjexlltqhjdmlwxgptpj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tXJAIc_OeskuGOgXB_7pfg_HyVjbGsF';
const FALLBACK_IMAGE = 'https://i.ibb.co/gGgdZ6x/Chat-GPT-Image-14-may-2026-18-57-48.png';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function absoluteUrl(req, path) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}${path}`;
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

module.exports = async function handler(req, res) {
  const requestedSlug = String(req.query?.slug || '').trim();

  if (!requestedSlug) {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/noticias?select=id,titulo,resumen,contenido,imagen_url,publicada,slug,created_at&publicada=eq.true&limit=1000`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`);
    const rows = await response.json();
    const article = rows.find(n => String(n.slug || '') === requestedSlug)
      || rows.find(n => String(n.id || '') === requestedSlug)
      || rows.find(n => slugify(n.titulo) === requestedSlug);

    if (!article) {
      res.statusCode = 302;
      res.setHeader('Location', '/#/noticias');
      return res.end();
    }

    const canonicalPath = `/noticia/${encodeURIComponent(article.slug || slugify(article.titulo) || article.id)}`;
    const shareUrl = absoluteUrl(req, canonicalPath);
    const appUrl = `/#/noticia/${encodeURIComponent(article.slug || slugify(article.titulo) || article.id)}`;
    const title = `${article.titulo || 'Noticia'} | Gamarra TV`;
    const description = article.resumen || 'Lee esta noticia en Gamarra TV, noticias, televisión y actualidad del sur del Cesar y Magdalena Medio.';
    const image = article.imagen_url || FALLBACK_IMAGE;

    // A crawler such as Facebook receives the OG tags immediately.
    // A normal visitor is sent to the existing SPA article route.
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Gamarra TV">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(article.titulo || 'Gamarra TV')}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:url" content="${esc(shareUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(appUrl)}">
</head>
<body>
<p>Abriendo la noticia de Gamarra TV…</p>
<script>window.location.replace(${JSON.stringify(appUrl)});</script>
</body>
</html>`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.end(html);
  } catch (error) {
    console.error(error);
    res.statusCode = 302;
    res.setHeader('Location', '/#/noticias');
    return res.end();
  }
};

// api/event-og.js
// Serverless OG/preview para eventos (Vercel). Compatible con ESM usando import dinámico.

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const absoluteUrl = (maybeUrl, origin) => {
  if (!maybeUrl) return '';
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  return `${origin.replace(/\/$/, '')}/${maybeUrl.replace(/^\//, '')}`;
};

module.exports = async (req, res) => {
  try {
    // ⬇️ ESM: importar supabase-js dinámicamente
    const { createClient } = await import('@supabase/supabase-js');

    const SUPABASE_URL =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL;

    const SUPABASE_ANON_KEY =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.REACT_APP_SUPABASE_ANON_KEY;

    const { event: idOrSlug, slug } = req.query;
    const identifier = slug || idOrSlug;

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${proto}://${host}`;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase env vars');
      const fallback = `${origin}/events${identifier ? `?event=${encodeURIComponent(identifier)}` : ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res
        .status(200)
        .send(`<!doctype html><meta http-equiv="refresh" content="0; url=${fallback}">`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let event = null;
    if (identifier) {
      let query = supabase
        .from('events')
        .select('id,event_name,description,mainphoto,start_date,end_date,city,country,status')
        .limit(1);

      if (/^[0-9a-f-]{16,}$/i.test(identifier)) query = query.eq('id', identifier);
      else query = query.eq('slug', identifier);

      const { data, error } = await query.single();
      if (!error && data) event = data;
      else if (error) console.error('Supabase error:', error);
    }

    const title = event ? event.event_name : 'SeaEvents | YachtDayWork';
    const cityCountry = event ? [event.city, event.country].filter(Boolean).join(', ') : '';
    const dateRange = event?.start_date
      ? new Date(event.start_date).toLocaleDateString('es-ES', {
          day: '2-digit', month: 'short', year: 'numeric',
        })
      : '';
    const description = event
      ? `${cityCountry}${cityCountry && dateRange ? ' · ' : ''}${dateRange}`
      : 'Explora eventos compartidos por la comunidad náutica.';

    const image = absoluteUrl(event?.mainphoto || '/logo512.png', origin);

    // A dónde se redirige a humanos (SPA)
    const canonical = event
      ? `${origin}/events?event=${encodeURIComponent(event.id)}`
      : `${origin}/events`;

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${canonical}">
<meta name="viewport" content="width=device-width, initial-scale=1">

<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${image}">

<meta http-equiv="refresh" content="0; url=${canonical}">
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial,sans-serif;padding:24px}
  .card{max-width:720px;margin:0 auto;text-align:center}
  .img{width:100%;max-width:720px;border-radius:12px}
  a{color:#0070f3;text-decoration:none}
</style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <img class="img" src="${image}" alt="">
    <p>Redireccionando… Si no ocurre, <a href="${canonical}">haz clic aquí</a>.</p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('event-og crash:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(200)
      .send(`<!doctype html><meta http-equiv="refresh" content="0; url=/events">`);
  }
};
// api/service-og.js
// Serverless OG/preview for services (Vercel). Compatible with ESM using dynamic import.

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
    const { createClient } = await import('@supabase/supabase-js');

    const SUPABASE_URL =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.REACT_APP_SUPABASE_URL;

    const SUPABASE_ANON_KEY =
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.REACT_APP_SUPABASE_ANON_KEY;

    const { service: id } = req.query;

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = `${proto}://${host}`;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase env vars');
      const fallback = `${origin}/yacht-services${id ? `?service=${encodeURIComponent(id)}` : ''}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res
        .status(200)
        .send(`<!doctype html><meta http-equiv="refresh" content="0; url=${fallback}">`);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let service = null;
    if (id) {
      const { data, error } = await supabase
        .from('services')
        .select('id,company_name,description,mainphoto,city,country')
        .eq('id', id)
        .single();
      if (!error && data) service = data;
      else if (error) console.error('Supabase error:', error);
    }

    const title = service ? service.company_name : 'SeaServices | YachtDayWork';
    const cityCountry = service ? [service.city, service.country].filter(Boolean).join(', ') : '';
    const description = service
      ? cityCountry || 'Discover yacht services from the community.'
      : 'Discover yacht services from the community.';

    const image = absoluteUrl(service?.mainphoto || '/logo512.png', origin);

    const canonical = service
      ? `${origin}/yacht-services?service=${encodeURIComponent(service.id)}`
      : `${origin}/yacht-services`;

    const html = `<!doctype html>
<html lang="en">
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
    <p>Redirecting... If it does not happen, <a href="${canonical}">click here</a>.</p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('service-og crash:', err);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res
      .status(200)
      .send(`<!doctype html><meta http-equiv="refresh" content="0; url=/yacht-services">`);
  }
};
